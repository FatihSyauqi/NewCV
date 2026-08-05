import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

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

    // Fetch image_url to delete file
    const blogs = await query("SELECT image_url FROM blogs WHERE id = ? LIMIT 1", [id]);
    const blog = blogs[0];

    await query("DELETE FROM blogs WHERE id = ?", [id]);

    if (blog?.image_url && blog.image_url.startsWith("/uploads/")) {
      const cvFilePath = path.join(process.cwd(), "..", "frontend-cv", "public", blog.image_url);
      const adminFilePath = path.join(process.cwd(), "public", blog.image_url);
      try { await fs.unlink(cvFilePath); } catch (e) {}
      try { await fs.unlink(adminFilePath); } catch (e) {}
    }

    return NextResponse.json({ success: true, message: "Blog post deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
