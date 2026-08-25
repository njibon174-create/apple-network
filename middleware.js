// middleware.js
// Why: refresh the Supabase auth session on every request and protect /admin/*.
// Note: the actual role check happens again in the admin layout (defense in depth) —
// middleware only ensures a logged-in session cookie exists.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, NextRequest } from "next/server";

const PROTECTED = ["/admin"];

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
