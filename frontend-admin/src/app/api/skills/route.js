import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const skills = await query("SELECT * FROM skills ORDER BY id DESC");
    return NextResponse.json(skills);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, category, logo_url, sort_order, is_highlight } = await request.json();

    if (!name || !category) {
      return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
    }

    const result = await query(
      "INSERT INTO skills (name, category, logo_url, sort_order, is_highlight) VALUES (?, ?, ?, ?, ?)",
      [name, category, logo_url || null, parseInt(sort_order, 10) || 0, is_highlight ? 1 : 0]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: "Skill created successfully"
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
