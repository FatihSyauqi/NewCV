import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const profiles = await query("SELECT * FROM personal_info LIMIT 1");
    return NextResponse.json(profiles[0] || {});
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, title, email, linkedin, github, location, about_me, avatar_url } = await request.json();

    await query(
      `UPDATE personal_info 
       SET name = ?, title = ?, email = ?, linkedin = ?, github = ?, location = ?, about_me = ?, avatar_url = ? 
       WHERE id = 1`,
      [name, title, email, linkedin, github, location, about_me, avatar_url]
    );

    return NextResponse.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
