// components/SiteChrome.jsx
// Why: the store Header/Footer should NOT appear on /admin or /login. This client
// wrapper renders them only on storefront routes, using the pathname.
"use client";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SiteChrome() {
  const pathname = usePathname();
  const adminZone = pathname?.startsWith("/admin") || pathname === "/login";
  if (adminZone) return null;
  return (
    <>
      <Header />
      <Footer />
    </>
  );
}
