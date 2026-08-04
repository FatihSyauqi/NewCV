import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const blogs = await query("SELECT * FROM blogs ORDER BY id DESC");
    return NextResponse.json(blogs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, slug, excerpt, content, image_url, category, status } = await request.json();

    const finalSlug = slug || title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // remove invalid chars
      .replace(/[\s-]+/g, '-')     // replace spaces/hyphens with single hyphen
      .replace(/^-+|-+$/g, '');     // trim leading/trailing hyphens

    const result = await query(
      `INSERT INTO blogs (title, slug, excerpt, content, image_url, category, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, finalSlug, excerpt, content, image_url || "/images/blog-placeholder.svg", category, status || "published"]
    );

    return NextResponse.json({ success: true, id: result.insertId, message: "Blog post created successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
