// components/SiteChrome.jsx
// Why: the store Header should NOT appear on /admin or /login. Footer is handled
// separately by SiteFooter so it renders AFTER <main> (below the page content).
"use client";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";

export default function SiteChrome() {
  const pathname = usePathname();
  const adminZone = pathname?.startsWith("/admin") || pathname === "/login";
  if (adminZone) return null;
  return <Header />;
}
