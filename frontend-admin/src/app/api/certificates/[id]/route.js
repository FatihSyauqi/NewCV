import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { title, issuer, credential_id, issue_date, sort_order } = await request.json();

    await query(
      `UPDATE certificates 
       SET title = ?, issuer = ?, credential_id = ?, issue_date = ?, sort_order = ? 
       WHERE id = ?`,
      [title, issuer, credential_id, issue_date, sort_order, id]
    );

    return NextResponse.json({ success: true, message: "Certificate updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    await query("DELETE FROM certificates WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "Certificate deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
