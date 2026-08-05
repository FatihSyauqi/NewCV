import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { name, category, logo_url, sort_order, is_highlight } = await request.json();

    if (!name || !category) {
      return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
    }

    await query(
      "UPDATE skills SET name = ?, category = ?, logo_url = ?, sort_order = ?, is_highlight = ? WHERE id = ?",
      [name, category, logo_url || null, parseInt(sort_order, 10) || 0, is_highlight ? 1 : 0, id]
    );

    return NextResponse.json({
      success: true,
      message: "Skill updated successfully"
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Fetch logo_url to delete file
    const skills = await query("SELECT logo_url FROM skills WHERE id = ? LIMIT 1", [id]);
    const skill = skills[0];

    await query("DELETE FROM skills WHERE id = ?", [id]);

    if (skill?.logo_url && skill.logo_url.startsWith("/uploads/")) {
      const cvFilePath = path.join(process.cwd(), "..", "frontend-cv", "public", skill.logo_url);
      const adminFilePath = path.join(process.cwd(), "public", skill.logo_url);
      try { await fs.unlink(cvFilePath); } catch (e) {}
      try { await fs.unlink(adminFilePath); } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      message: "Skill deleted successfully"
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
