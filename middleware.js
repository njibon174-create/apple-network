// middleware.js
// Why: cheap first gate for /admin/* — redirect to /login only when there is no
// session cookie at all. The AUTHORITATIVE auth + owner-role check happens in
// app/admin/layout.jsx (Node runtime, reliable). Keeping middleware minimal here
// avoids Edge-runtime getUser()/cookie-decoding flakiness.
import { NextResponse, NextRequest } from "next/server";

export const config = {
  matcher: ["/admin/:path*", "/login"],
};

const COOKIE_RE = /sb-[a-z0-9]+-auth-token/;

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.getAll().some((c) => COOKIE_RE.test(c.name));

  if (pathname.startsWith("/admin") && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}
