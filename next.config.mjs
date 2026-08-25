/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow serving the dev site from the VPS public IP
  images: { unoptimized: true },
};

export default nextConfig;
