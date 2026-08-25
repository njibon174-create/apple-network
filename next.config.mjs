/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow serving the dev site from the VPS public IP
  images: { unoptimized: true },
  // Expose the Supabase credentials to the BROWSER (client components: checkout,
  // cart/order writes, search). Next.js only injects NEXT_PUBLIC_* into client
  // bundles; your Vercel env vars are named NEXT_SUPABASE_URL / NEXT_SUPABASE_ANON_KEY
  // (no PUBLIC), so we map them to NEXT_PUBLIC_* here. Server components continue to
  // read the original NEXT_SUPABASE_* names directly.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
