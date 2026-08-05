import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { title, category, description, tech_stack, image_url, preview_url } = await request.json();

    await query(
      `UPDATE portfolios 
       SET title = ?, category = ?, description = ?, tech_stack = ?, image_url = ?, preview_url = ? 
       WHERE id = ?`,
      [title, category, description, tech_stack, image_url, preview_url, id]
    );

    return NextResponse.json({ success: true, message: "Portfolio updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Fetch image_url to delete file
    const portfolios = await query("SELECT image_url FROM portfolios WHERE id = ? LIMIT 1", [id]);
    const portfolio = portfolios[0];

    await query("DELETE FROM portfolios WHERE id = ?", [id]);

    if (portfolio?.image_url && portfolio.image_url.startsWith("/uploads/")) {
      const cvFilePath = path.join(process.cwd(), "..", "frontend-cv", "public", portfolio.image_url);
      const adminFilePath = path.join(process.cwd(), "public", portfolio.image_url);
      try { await fs.unlink(cvFilePath); } catch (e) {}
      try { await fs.unlink(adminFilePath); } catch (e) {}
    }

    return NextResponse.json({ success: true, message: "Portfolio deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
