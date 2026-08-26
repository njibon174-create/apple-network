// middleware.js
// Why: refreshes the Supabase session on every request and writes the rotated
// cookie back to the response. This is REQUIRED so that server actions (which
// cannot set cookies themselves) keep a valid session — without it, clicking an
// action drops auth, the layout's getUser() returns null, and you get bounced to
// /login (blank page after Cancel/Packing). Also gates /admin behind a session.
import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const config = {
  matcher: ["/admin/:path*", "/login"],
};

const COOKIE_RE = /sb-[a-z0-9]+-auth-token/;

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_SUPABASE_ANON_KEY;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh the session (writes rotated cookie into `response`).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const hasSession = request.cookies.getAll().some((c) => COOKIE_RE.test(c.name));

  // Gate admin: no session -> login.
  if (pathname.startsWith("/admin") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // Logged-in user hitting /login -> send to admin.
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}
