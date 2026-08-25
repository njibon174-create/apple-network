// lib/supabase/client.js
// Why: browser-side Supabase client using @supabase/ssr. Used by the admin login
// form and any admin client components. Only NEXT_PUBLIC_* vars are available here.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createBrowserClient(url, key);
}
