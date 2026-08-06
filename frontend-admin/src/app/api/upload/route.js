import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")         // Replace spaces with -
    .replace(/[^\w\-]+/g, "")       // Remove all non-word chars
    .replace(/\-\-+/g, "-");        // Replace multiple - with single -
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const type = formData.get("type") || "skills";
    const nameParam = formData.get("name") || "";
    const oldPath = formData.get("oldPath") || "";

    // Clean up old file from central frontend-admin directory
    if (oldPath && oldPath.startsWith("/uploads/")) {
      const adminOldFilePath = path.join(process.cwd(), "public", oldPath);
      try { await fs.unlink(adminOldFilePath); } catch (e) {}
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create SEO friendly slugged filename
    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext);
    let sluggedName = slugify(nameParam || baseName);
    if (!sluggedName) sluggedName = "upload";
    
    const randomSuffix = Math.floor(Math.random() * 65536).toString(16).padStart(4, "0");
    const filename = `${sluggedName}-${randomSuffix}${ext}`;

    // Define single central upload directory in frontend-admin
    const adminPublicDir = path.join(process.cwd(), "public", "uploads", type);
    await fs.mkdir(adminPublicDir, { recursive: true });

    const adminFilePath = path.join(adminPublicDir, filename);
    await fs.writeFile(adminFilePath, buffer);

    // Return the relative URL path
    const logoUrl = `/uploads/${type}/${filename}`;
    return NextResponse.json({ success: true, logoUrl });
  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { filePath } = await request.json();
    if (!filePath || !filePath.startsWith("/uploads/")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const adminFilePath = path.join(process.cwd(), "public", filePath);
    try { await fs.unlink(adminFilePath); } catch (e) {}

    return NextResponse.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete File API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
