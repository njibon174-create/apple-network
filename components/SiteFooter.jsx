// components/SiteFooter.jsx
// Why: the store Footer must render AFTER the page content (below <main>), and must
// be hidden on /admin and /login. Kept as a client wrapper so it can read pathname.
"use client";
import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

export default function SiteFooter() {
  const pathname = usePathname();
  const adminZone = pathname?.startsWith("/admin") || pathname === "/login";
  if (adminZone) return null;
  return <Footer />;
}
