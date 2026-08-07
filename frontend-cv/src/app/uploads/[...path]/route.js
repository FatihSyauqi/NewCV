import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MIME_TYPES = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".zip": "application/zip",
  ".rar": "application/vnd.rar",
  ".csv": "text/csv",
};

export async function GET(request, { params }) {
  try {
    const pathSegments = params?.path || [];
    if (!pathSegments.length) {
      return new NextResponse("File not found", { status: 404 });
    }

    const relativePath = pathSegments.join("/");

    // Security check: prevent directory traversal
    if (relativePath.includes("..")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Possible file locations
    const possiblePaths = [
      path.join(process.cwd(), "public", "uploads", relativePath),
      path.join(process.cwd(), "..", "frontend-admin", "public", "uploads", relativePath),
      path.join(process.cwd(), "..", "frontend-cv", "public", "uploads", relativePath),
    ];

    let foundPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        foundPath = p;
        break;
      }
    }

    if (!foundPath) {
      return new NextResponse("File not found on server", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(foundPath);
    const ext = path.extname(foundPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const filename = path.basename(foundPath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": (ext === ".pdf" || ext.startsWith(".jpg") || ext === ".png") ? "inline" : `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error serving upload file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
