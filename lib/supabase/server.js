// lib/supabase/server.js
// Why: server-side Supabase client using @supabase/ssr (current standard, replaces
// the deprecated auth-helpers package). Used by server components, server actions,
// and route handlers. Reads NEXT_PUBLIC_* (injected to client) OR NEXT_SUPABASE_*
// (server) so it works in both contexts.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = cookies();
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_SUPABASE_ANON_KEY;
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — safe to ignore (middleware refreshes).
        }
      },
    },
  });
}
