import { NextResponse } from "next/server";
import { verifyToken } from "./lib/jwt";

export async function middleware(request) {
  const token = request.cookies.get("admin_token")?.value;
  const { pathname } = request.nextUrl;

  // Let API auth requests pass
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check authentication
  const payload = token ? await verifyToken(token) : null;

  // If path is /login
  if (pathname === "/login") {
    if (payload) {
      return NextResponse.redirect(new URL(request.nextUrl.basePath || "/", request.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized access" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    return NextResponse.redirect(new URL((request.nextUrl.basePath || "") + "/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/profile/:path*",
    "/blogs/:path*",
    "/portfolios/:path*",
    "/cv-sections/:path*",
    "/login",
    "/api/blogs/:path*",
    "/api/portfolios/:path*",
    "/api/profile/:path*",
    "/api/experiences/:path*",
    "/api/education/:path*",
    "/api/certificates/:path*",
    "/api/skills/:path*",
    "/api/upload",
  ],
};
