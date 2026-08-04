import { query } from "@/lib/db";
import { NextResponse } from "next/server";

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

    await query("DELETE FROM portfolios WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "Portfolio deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
