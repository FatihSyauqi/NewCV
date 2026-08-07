import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request, { params }) {
  try {
    const filename = params?.filename;
    if (!filename) return new NextResponse("Not Found", { status: 404 });

    const possiblePaths = [
      path.join(process.cwd(), "public", "images", filename),
      path.join(process.cwd(), "..", "frontend-cv", "public", "images", filename),
    ];

    let foundPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        foundPath = p;
        break;
      }
    }

    if (!foundPath) return new NextResponse("Image Not Found", { status: 404 });

    const fileBuffer = fs.readFileSync(foundPath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    return new NextResponse("Error", { status: 500 });
  }
}
