// middleware.js
// Why: cheap first gate for /admin/* — redirect to /login only when there is no
// session cookie at all. The AUTHORITATIVE auth + owner-role check happens in
// app/admin/layout.jsx (Node runtime, reliable). Keeping middleware minimal here
// avoids Edge-runtime getUser()/cookie-decoding flakiness.
//
// IMPORTANT: we intentionally do NOT bounce /login -> /admin here. The login page
// redirects to /admin itself after a successful sign-in. Bouncing on mere cookie
// *presence* caused ERR_TOO_MANY_REDIRECTS when a stale/invalid session cookie
// existed (middleware sent you to /admin, the layout's getUser() failed, it sent
// you back to /login, repeat).
import { NextResponse, NextRequest } from "next/server";

export const config = {
  matcher: ["/admin/:path*", "/login"],
};

const COOKIE_RE = /sb-[a-z0-9]+-auth-token/;

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.getAll().some((c) => COOKIE_RE.test(c.name));

  // Gate: no session cookie -> must log in.
  if (pathname.startsWith("/admin") && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // /login is always reachable (the page redirects to /admin after a real sign-in).
  return NextResponse.next();
}
