import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { company, role, location, start_date, end_date, description, sort_order } = await request.json();

    await query(
      `UPDATE experiences 
       SET company = ?, role = ?, location = ?, start_date = ?, end_date = ?, description = ?, sort_order = ? 
       WHERE id = ?`,
      [company, role, location, start_date, end_date, description, sort_order, id]
    );

    return NextResponse.json({ success: true, message: "Experience updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    await query("DELETE FROM experiences WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "Experience deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
