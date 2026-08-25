// lib/supabase/client.js
// Why: singleton Supabase browser client for client components (cart, checkout, tracking, auth).
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_SUPABASE_URL,
    process.env.NEXT_SUPABASE_ANON_KEY
  );
}