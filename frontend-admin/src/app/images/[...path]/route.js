import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MIME_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

export async function GET(request, { params }) {
  try {
    const pathSegments = params?.path || [];
    if (!pathSegments.length) {
      return new NextResponse("Image not found", { status: 404 });
    }

    const relativePath = pathSegments.join("/");

    // Security check: prevent directory traversal
    if (relativePath.includes("..")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Possible image locations across both projects
    const possiblePaths = [
      path.join(process.cwd(), "public", "images", relativePath),
      path.join(process.cwd(), "..", "frontend-cv", "public", "images", relativePath),
      path.join(process.cwd(), "..", "frontend-admin", "public", "images", relativePath),
    ];

    let foundPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        foundPath = p;
        break;
      }
    }

    if (!foundPath) {
      return new NextResponse("Image not found on server", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(foundPath);
    const ext = path.extname(foundPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "image/png";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving image file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
