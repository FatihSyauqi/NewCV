import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const portfolios = await query("SELECT * FROM portfolios ORDER BY id DESC");
    return NextResponse.json(portfolios);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, category, description, tech_stack, image_url, preview_url } = await request.json();

    const result = await query(
      `INSERT INTO portfolios (title, category, description, tech_stack, image_url, preview_url) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, category, description, tech_stack, image_url || "/images/portfolio-placeholder.svg", preview_url]
    );

    return NextResponse.json({ success: true, id: result.insertId, message: "Portfolio added successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
