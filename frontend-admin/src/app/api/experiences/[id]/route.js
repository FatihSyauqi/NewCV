import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { company, role, location, start_date, end_date, description, sort_order, logo_url } = await request.json();

    await query(
      `UPDATE experiences 
       SET company = ?, role = ?, location = ?, start_date = ?, end_date = ?, description = ?, sort_order = ?, logo_url = ? 
       WHERE id = ?`,
      [company, role, location, start_date, end_date, description, sort_order, logo_url || null, id]
    );

    return NextResponse.json({ success: true, message: "Experience updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Fetch the experience first to get logo_url
    const rows = await query("SELECT logo_url FROM experiences WHERE id = ?", [id]);
    const logoUrl = rows[0]?.logo_url;

    await query("DELETE FROM experiences WHERE id = ?", [id]);

    // Clean up file if exists
    if (logoUrl && !logoUrl.startsWith("http")) {
      const fs = require("fs");
      const path = require("path");
      
      const filePaths = [
        path.join(process.cwd(), "public", logoUrl),
        path.join(process.cwd(), "..", "frontend-cv", "public", logoUrl)
      ];

      filePaths.forEach((fp) => {
        if (fs.existsSync(fp)) {
          try {
            fs.unlinkSync(fp);
          } catch (e) {
            console.error("Failed to delete experience logo file:", e);
          }
        }
      });
    }

    return NextResponse.json({ success: true, message: "Experience deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
