import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const inquiries = await query("SELECT * FROM contact_inquiries ORDER BY created_at DESC");
    const files = await query("SELECT * FROM contact_inquiries_files ORDER BY id ASC");

    // Group files by inquiry_id
    const filesByInquiry = {};
    for (const f of files) {
      if (!filesByInquiry[f.inquiry_id]) {
        filesByInquiry[f.inquiry_id] = [];
      }
      filesByInquiry[f.inquiry_id].push(f);
    }

    const result = inquiries.map((inq) => ({
      ...inq,
      db_files: filesByInquiry[inq.id] || [],
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // 1. Fetch file URLs from contact_inquiries_files
    const dbFiles = await query("SELECT file_url FROM contact_inquiries_files WHERE inquiry_id = ?", [id]);
    
    // 2. Fetch legacy JSON files column if any
    const inqRows = await query("SELECT files FROM contact_inquiries WHERE id = ?", [id]);
    const legacyFiles = inqRows[0]?.files ? JSON.parse(inqRows[0].files) : [];

    // Collect unique file URLs
    const fileUrls = new Set();
    dbFiles.forEach((f) => { if (f.file_url) fileUrls.add(f.file_url); });
    legacyFiles.forEach((f) => { if (f) fileUrls.add(f); });

    // 3. Delete physical files from both frontend-cv and frontend-admin public directories
    for (const fileUrl of fileUrls) {
      if (fileUrl && fileUrl.startsWith("/uploads/")) {
        const adminFilePath = path.join(process.cwd(), "public", fileUrl);
        const cvFilePath = path.join(process.cwd(), "..", "frontend-cv", "public", fileUrl);

        try { await fs.unlink(adminFilePath); } catch (e) {}
        try { await fs.unlink(cvFilePath); } catch (e) {}
      }
    }

    // 4. Delete DB record (Foreign key cascade will auto-delete contact_inquiries_files entries)
    await query("DELETE FROM contact_inquiries WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "Inquiry and physical files deleted successfully" });
  } catch (error) {
    console.error("Error deleting inquiry and files:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
