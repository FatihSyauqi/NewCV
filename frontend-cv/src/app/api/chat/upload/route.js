import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".doc", ".docx"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "Tidak ada file yang diunggah" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file terlalu besar! Maksimal ukuran file yang diizinkan adalah 2 MB." },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: "Format file tidak diizinkan. Hanya file Gambar (PNG, JPG, WEBP), PDF, dan Word (DOC, DOCX) yang diperbolehkan." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const baseName = path.basename(file.name, ext);
    let sluggedName = slugify(baseName);
    if (!sluggedName) sluggedName = "chat-file";

    const randomSuffix = Math.floor(Math.random() * 65536).toString(16).padStart(4, "0");
    const filename = `${sluggedName}-${randomSuffix}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "chat");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    const file_url = `/uploads/chat/${filename}`;

    return NextResponse.json({
      success: true,
      file_url,
      file_name: file.name,
      file_size: file.size
    });
  } catch (error) {
    console.error("Chat file upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
