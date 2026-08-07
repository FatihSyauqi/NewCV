import { query } from "@/lib/db";
import { sanitizeHtml } from "@/lib/sanitizer";
import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function isPrivateOrLocalIp(ip) {
  if (!ip) return true;
  const clean = ip.replace(/^::ffff:/, '');
  if (clean === '::1' || clean === '127.0.0.1' || clean === 'localhost') return true;
  if (clean.startsWith('10.') || clean.startsWith('192.168.')) return true;
  if (clean.startsWith('172.')) {
    const parts = clean.split('.');
    const second = parseInt(parts[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

const getClientIp = (request, fallbackIp = null) => {
  // 1. Cloudflare header
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && !isPrivateOrLocalIp(cfIp)) return cfIp.trim();

  // 2. Nginx / Proxy Real IP
  const realIp = request.headers.get("x-real-ip");
  if (realIp && !isPrivateOrLocalIp(realIp)) return realIp.trim();

  // 3. X-Forwarded-For header chain
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map(ip => ip.trim());
    const publicIp = ips.find(ip => !isPrivateOrLocalIp(ip));
    if (publicIp) return publicIp;
  }

  // 4. Other proxy headers
  const clientIp = request.headers.get("x-client-ip") || request.headers.get("true-client-ip") || request.headers.get("fastly-client-ip");
  if (clientIp && !isPrivateOrLocalIp(clientIp)) return clientIp.trim();

  // 5. Client-side browser detected Public IP fallback
  if (fallbackIp && !isPrivateOrLocalIp(fallbackIp)) return fallbackIp.trim();

  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp) return realIp.trim();

  return fallbackIp || "127.0.0.1";
};

async function ensureTablesAndColumns() {
  await query(`
    CREATE TABLE IF NOT EXISTS \`chat_sessions\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`session_token\` varchar(64) NOT NULL,
      \`full_name\` varchar(100) NOT NULL,
      \`email\` varchar(100) NOT NULL,
      \`phone_number\` varchar(50) NOT NULL,
      \`ip_address\` varchar(45) DEFAULT NULL,
      \`visitor_device_id\` varchar(64) DEFAULT NULL,
      \`initial_message\` text DEFAULT NULL,
      \`status\` varchar(20) DEFAULT 'active',
      \`closed_by\` varchar(20) DEFAULT NULL,
      \`unread_user\` int(11) DEFAULT 0,
      \`unread_admin\` int(11) DEFAULT 0,
      \`user_typing_at\` timestamp NULL DEFAULT NULL,
      \`admin_typing_at\` timestamp NULL DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`session_token\` (\`session_token\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS \`chat_messages\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`session_id\` int(11) NOT NULL,
      \`sender_type\` enum('user','admin') NOT NULL,
      \`sender_name\` varchar(100) NOT NULL,
      \`message_html\` text NOT NULL,
      \`attachment_url\` varchar(255) DEFAULT NULL,
      \`attachment_name\` varchar(255) DEFAULT NULL,
      \`attachment_size\` int(11) DEFAULT NULL,
      \`is_read\` tinyint(1) DEFAULT 0,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (\`id\`),
      KEY \`session_id\` (\`session_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS \`chat_blocked_entities\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`type\` enum('ip','email','phone') NOT NULL,
      \`value\` varchar(150) NOT NULL,
      \`reason\` varchar(255) DEFAULT 'Spam/Abuse',
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`type_value\` (\`type\`, \`value\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS \`chat_admin_status\` (
      \`id\` int(11) NOT NULL PRIMARY KEY,
      \`last_seen\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Safely check and add missing columns without throwing ER_DUP_FIELDNAME
  try {
    const columns = await query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_sessions'`
    );

    const columnNames = (columns || []).map((c) => (c.COLUMN_NAME || c.column_name || "").toLowerCase());

    if (!columnNames.includes("ip_address")) {
      await query(`ALTER TABLE \`chat_sessions\` ADD COLUMN \`ip_address\` varchar(45) DEFAULT NULL AFTER \`phone_number\``);
    }
    if (!columnNames.includes("visitor_device_id")) {
      await query(`ALTER TABLE \`chat_sessions\` ADD COLUMN \`visitor_device_id\` varchar(64) DEFAULT NULL AFTER \`ip_address\``);
    }
    if (!columnNames.includes("closed_by")) {
      await query(`ALTER TABLE \`chat_sessions\` ADD COLUMN \`closed_by\` varchar(20) DEFAULT NULL AFTER \`status\``);
    }
    if (!columnNames.includes("user_typing_at")) {
      await query(`ALTER TABLE \`chat_sessions\` ADD COLUMN \`user_typing_at\` timestamp NULL DEFAULT NULL`);
    }
    if (!columnNames.includes("admin_typing_at")) {
      await query(`ALTER TABLE \`chat_sessions\` ADD COLUMN \`admin_typing_at\` timestamp NULL DEFAULT NULL`);
    }
  } catch (e) {}
}

async function isVisitorBlocked(ip, email, phone) {
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanPhone = (phone || "").replace(/\D/g, "");

  const checks = await query(
    `SELECT * FROM chat_blocked_entities 
     WHERE (type = 'ip' AND value = ?)
        OR (type = 'email' AND value = ? AND ? != '')
        OR (type = 'phone' AND value = ? AND ? != '')
     LIMIT 1`,
    [ip, cleanEmail, cleanEmail, cleanPhone, cleanPhone]
  );

  return checks && checks.length > 0;
}

async function isAdminOffline() {
  const res = await query(`SELECT TIMESTAMPDIFF(SECOND, last_seen, NOW()) as seconds_since_last_seen FROM chat_admin_status WHERE id = 1 LIMIT 1`);
  if (!res || res.length === 0) return true;
  const seconds = res[0].seconds_since_last_seen;
  return seconds === null || seconds > 15;
}

async function checkAndSendTelegramNotification({ senderName, email, phone, messageText, title = "CHAT SESI BARU" }) {
  try {
    const offline = await isAdminOffline();
    if (!offline) return; // Admin is online, skip Telegram alert!

    const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    const chatId = process.env.TELEGRAM_CHAT_ID || "";

    if (!botToken || !chatId) return;

    const cleanText = (messageText || "").replace(/<[^>]+>/g, "").trim();

    const text = `🚨 *${title} (ADMIN OFFLINE)* 🚨\n\n` +
      `👤 *Nama:* ${senderName}\n` +
      `📧 *Email:* ${email}\n` +
      `📱 *No. HP:* ${phone}\n` +
      `💬 *Pesan:* ${cleanText}\n` +
      `🕒 *Waktu:* ${new Date().toLocaleString("id-ID")}`;

    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown"
      })
    }).catch((err) => console.error("Telegram notify fetch error:", err));
  } catch (e) {
    console.error("Telegram notification error:", e);
  }
}

export async function POST(request) {
  try {
    await ensureTablesAndColumns();

    const body = await request.json();
    const { full_name, email, phone_number, initial_message, visitor_device_id, client_public_ip } = body;
    const clientIp = getClientIp(request, client_public_ip);

    if (!full_name || !email || !phone_number || !initial_message) {
      return NextResponse.json(
        { error: "Nama Lengkap, Email, No. HP, dan Pesan Awal wajib diisi." },
        { status: 400 }
      );
    }

    // Silent Block Check (No notification to user)
    const blocked = await isVisitorBlocked(clientIp, email, phone_number);
    if (blocked) {
      return NextResponse.json(
        { error: "Maaf, layanan obrolan saat ini sedang tidak dapat memproses permintaan Anda." },
        { status: 400 }
      );
    }

    const session_token = crypto.randomBytes(32).toString("hex");

    const sessionRes = await query(
      `INSERT INTO chat_sessions (session_token, full_name, email, phone_number, ip_address, visitor_device_id, initial_message, status, unread_admin)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 1)`,
      [
        session_token,
        full_name,
        email,
        phone_number,
        clientIp,
        visitor_device_id || null,
        initial_message
      ]
    );

    const sessionId = sessionRes.insertId;
    const cleanMessage = sanitizeHtml(initial_message);

    await query(
      `INSERT INTO chat_messages (session_id, sender_type, sender_name, message_html, is_read)
       VALUES (?, 'user', ?, ?, 0)`,
      [sessionId, full_name, cleanMessage]
    );

    // Send Telegram Alert if Admin is Offline
    checkAndSendTelegramNotification({
      senderName: full_name,
      email,
      phone: phone_number,
      messageText: cleanMessage,
      title: "SESI CHAT BARU"
    });

    return NextResponse.json({
      success: true,
      session_token,
      message: "Obrolan berhasil dimulai"
    });
  } catch (error) {
    console.error("Init chat error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
