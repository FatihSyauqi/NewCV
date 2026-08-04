import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const experiences = await query("SELECT * FROM experiences ORDER BY sort_order ASC, id DESC");
    return NextResponse.json(experiences);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { company, role, location, start_date, end_date, description, sort_order } = await request.json();

    const result = await query(
      `INSERT INTO experiences (company, role, location, start_date, end_date, description, sort_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [company, role, location, start_date, end_date, description, sort_order || 0]
    );

    return NextResponse.json({ success: true, id: result.insertId, message: "Experience added successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
