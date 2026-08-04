import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const certificates = await query("SELECT * FROM certificates ORDER BY sort_order ASC, id DESC");
    return NextResponse.json(certificates);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, issuer, credential_id, issue_date, sort_order } = await request.json();

    const result = await query(
      `INSERT INTO certificates (title, issuer, credential_id, issue_date, sort_order) 
       VALUES (?, ?, ?, ?, ?)`,
      [title, issuer, credential_id, issue_date, sort_order || 0]
    );

    return NextResponse.json({ success: true, id: result.insertId, message: "Certificate added successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
