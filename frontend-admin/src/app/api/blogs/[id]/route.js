import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { title, slug, excerpt, content, image_url, category, status } = await request.json();

    const finalSlug = slug || title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    await query(
      `UPDATE blogs 
       SET title = ?, slug = ?, excerpt = ?, content = ?, image_url = ?, category = ?, status = ? 
       WHERE id = ?`,
      [title, finalSlug, excerpt, content, image_url, category, status, id]
    );

    return NextResponse.json({ success: true, message: "Blog post updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    await query("DELETE FROM blogs WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "Blog post deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
