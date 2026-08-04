import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { school, degree, major, gpa, start_date, end_date, sort_order } = await request.json();

    await query(
      `UPDATE education 
       SET school = ?, degree = ?, major = ?, gpa = ?, start_date = ?, end_date = ?, sort_order = ? 
       WHERE id = ?`,
      [school, degree, major, gpa, start_date, end_date, sort_order, id]
    );

    return NextResponse.json({ success: true, message: "Education updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    await query("DELETE FROM education WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "Education deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
