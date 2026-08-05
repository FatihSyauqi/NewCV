import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { school, degree, major, gpa, start_date, end_date, sort_order, logo_url } = await request.json();

    await query(
      `UPDATE education 
       SET school = ?, degree = ?, major = ?, gpa = ?, start_date = ?, end_date = ?, sort_order = ?, logo_url = ? 
       WHERE id = ?`,
      [school, degree, major, gpa, start_date, end_date, sort_order, logo_url || null, id]
    );

    return NextResponse.json({ success: true, message: "Education updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Fetch logo_url to clean up file
    const rows = await query("SELECT logo_url FROM education WHERE id = ?", [id]);
    const logoUrl = rows[0]?.logo_url;

    await query("DELETE FROM education WHERE id = ?", [id]);

    if (logoUrl && !logoUrl.startsWith("http")) {
      const fs = require("fs");
      const path = require("path");
      const filePaths = [
        path.join(process.cwd(), "public", logoUrl),
        path.join(process.cwd(), "..", "frontend-cv", "public", logoUrl)
      ];
      filePaths.forEach((fp) => {
        if (fs.existsSync(fp)) {
          try { fs.unlinkSync(fp); } catch (e) { console.error("Failed to delete file:", e); }
        }
      });
    }

    return NextResponse.json({ success: true, message: "Education deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
