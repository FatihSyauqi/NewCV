import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const education = await query("SELECT * FROM education ORDER BY sort_order ASC, id DESC");
    return NextResponse.json(education);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { school, degree, major, gpa, start_date, end_date, sort_order } = await request.json();

    const result = await query(
      `INSERT INTO education (school, degree, major, gpa, start_date, end_date, sort_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [school, degree, major, gpa, start_date, end_date, sort_order || 0]
    );

    return NextResponse.json({ success: true, id: result.insertId, message: "Education added successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
