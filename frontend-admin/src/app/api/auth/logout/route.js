import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  
  // Clear the session cookie
  response.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 0, // Immediately delete
    path: "/"
  });

  return response;
}
