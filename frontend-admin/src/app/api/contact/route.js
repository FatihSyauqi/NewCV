import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function sanitizeHtml(str) {
  if (!str) return "";
  return str
    .toString()
    .replace(/<[^>]*>?/gm, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toTitleCase(str) {
  if (!str) return "";
  return str.toString().replace(/\b[a-zA-Z]/g, (c) => c.toUpperCase());
}

export async function POST(request) {
  try {
    const formData = await request.formData();

    // Extract and sanitize inputs
    const rawName = formData.get("name")?.toString().trim();
    let rawPurpose = formData.get("purpose")?.toString().trim();
    const rawOtherPurpose = formData.get("other_purpose")?.toString().trim();
    const rawPhone = formData.get("phone")?.toString().trim();
    const rawEmail = formData.get("email")?.toString().trim();
    const rawCompanyName = formData.get("company_name")?.toString().trim();
    const rawMessage = formData.get("message")?.toString().trim();

    // Captcha parameters
    const captchaNum1 = parseInt(formData.get("captcha_num1")?.toString() || "0", 10);
    const captchaNum2 = parseInt(formData.get("captcha_num2")?.toString() || "0", 10);
    const captchaAnswer = parseInt(formData.get("captcha_answer")?.toString() || "-1", 10);

    // Verify Math Captcha server-side
    if (captchaAnswer !== captchaNum1 + captchaNum2) {
      return NextResponse.json(
        { error: `Verifikasi Captcha Matematika gagal. Jawaban dari ${captchaNum1} + ${captchaNum2} tidak sesuai!` },
        { status: 400, headers: corsHeaders }
      );
    }

    if (rawPurpose === "Lainnya" && rawOtherPurpose) {
      rawPurpose = `Lainnya (${rawOtherPurpose})`;
    }

    // Apply HTML sanitization & Title Case formatting
    const name = toTitleCase(sanitizeHtml(rawName));
    const purpose = sanitizeHtml(rawPurpose);
    const phone = sanitizeHtml(rawPhone);
    const email = sanitizeHtml(rawEmail);
    const company_name = rawCompanyName ? sanitizeHtml(rawCompanyName) : null;
    const message = sanitizeHtml(rawMessage);

    // Required fields validation
    if (!name || !purpose || !phone || !email || !message) {
      return NextResponse.json(
        { error: "Semua bidang wajib (Nama, Tujuan, No HP/WA, Email, Pesan) harus diisi!" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format alamat email tidak valid! (Contoh: nama@domain.com)" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Phone number format validation (+code followed by 7-18 digits)
    const phoneRegex = /^\+[0-9]{7,18}$/;
    if (!phoneRegex.test(phone.replace(/\s+/g, ""))) {
      return NextResponse.json(
        { error: "Nomor HP / WhatsApp tidak valid! Harap masukkan nomor yang sesuai dengan kode negara." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Process file attachments
    const files = formData.getAll("files");
    const uploadedFileUrls = [];
    const savedFilesData = [];

    const adminUploadDir = path.join(process.cwd(), "public", "uploads", "contact");
    const cvUploadDir = path.join(process.cwd(), "..", "frontend-cv", "public", "uploads", "contact");

    if (!fs.existsSync(adminUploadDir)) {
      fs.mkdirSync(adminUploadDir, { recursive: true });
    }
    if (!fs.existsSync(cvUploadDir)) {
      try { fs.mkdirSync(cvUploadDir, { recursive: true }); } catch (e) { }
    }

    for (const file of files) {
      if (file && typeof file === "object" && file.name && file.size > 0) {
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `File "${file.name}" melebihi ukuran maksimum 2MB!` },
            { status: 400, headers: corsHeaders }
          );
        }

        const ext = path.extname(file.name).toLowerCase();
        const allowedExts = [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp"];
        if (!allowedExts.includes(ext)) {
          return NextResponse.json(
            { error: `Tipe file "${file.name}" tidak didukung. Hanya PDF dan Gambar yang diizinkan!` },
            { status: 400, headers: corsHeaders }
          );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

        const adminFilePath = path.join(adminUploadDir, safeFilename);
        const cvFilePath = path.join(cvUploadDir, safeFilename);

        fs.writeFileSync(adminFilePath, buffer);
        try { fs.writeFileSync(cvFilePath, buffer); } catch (e) { }

        const publicUrl = `/uploads/contact/${safeFilename}`;
        uploadedFileUrls.push(publicUrl);
        savedFilesData.push({
          path: adminFilePath,
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type,
        });
      }
    }

    // Insert into MySQL Database: contact_inquiries
    const filesJson = uploadedFileUrls.length > 0 ? JSON.stringify(uploadedFileUrls) : null;
    const result = await query(
      `INSERT INTO contact_inquiries (name, purpose, phone, email, company_name, message, files) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, purpose, phone, email, company_name, message, filesJson]
    );

    const inquiryId = result.insertId;

    // Insert into separate MySQL Database table: contact_inquiries_files
    for (const f of savedFilesData) {
      await query(
        `INSERT INTO contact_inquiries_files (inquiry_id, file_name, file_url, file_size) 
         VALUES (?, ?, ?, ?)`,
        [inquiryId, f.name, f.url, f.size]
      );
    }

    // Prepare Telegram Notification Text (HTML mode)
    const telegramText = `
<b>📩 PESAN KONTAK BARU</b>

<b>👤 Nama:</b> ${name}
<b>🎯 Tujuan:</b> ${purpose}
<b>📱 No HP/WA:</b> ${phone}
<b>📧 Email:</b> ${email}
<b>🏢 Nama Usaha:</b> ${company_name || "-"}

<b>💬 Pesan:</b>
${message}

<b>📎 Lampiran File:</b> ${savedFilesData.length} file
<b>📅 Waktu:</b> ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
`.trim();

    // Send Telegram Notification Text
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: telegramText,
          parse_mode: "HTML",
        }),
      });
    } catch (tgErr) {
      console.error("Failed to send Telegram message:", tgErr);
    }

    // Send Attached Files to Telegram Chat
    for (const item of savedFilesData) {
      try {
        const tgFormData = new FormData();
        tgFormData.append("chat_id", TELEGRAM_CHAT_ID);
        tgFormData.append("caption", `📄 Lampiran dari ${name}: ${item.name}`);

        const fileBlob = new Blob([fs.readFileSync(item.path)], { type: item.type || "application/octet-stream" });

        const isImage = item.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        const endpoint = isImage ? "sendPhoto" : "sendDocument";
        const paramName = isImage ? "photo" : "document";

        tgFormData.append(paramName, fileBlob, item.name);

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${endpoint}`, {
          method: "POST",
          body: tgFormData,
        });
      } catch (fileTgErr) {
        console.error(`Failed to send file ${item.name} to Telegram:`, fileTgErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pesan Anda berhasil terkirim! Terima kasih telah menghubungi saya.",
        id: inquiryId,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error processing contact inquiry:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengirim pesan." },
      { status: 500, headers: corsHeaders }
    );
  }
}
