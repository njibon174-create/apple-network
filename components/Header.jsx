// components/Header.jsx
// Why: sticky top nav shared across all pages. Mobile-responsive with a hamburger drawer.
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { CATEGORIES, SITE } from "@/lib/data";
import Icon from "@/components/Icon";
import { useCart } from "@/lib/cart";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const items = useCart((s) => s.items);
  useEffect(() => {
    setCount(items.reduce((n, i) => n + i.qty, 0));
  }, [items]);
  const nav = [
    { href: "/shop", label: "শপ" },
    { href: "/category/phones", label: "ফোন" },
    { href: "/category/accessories", label: "অ্যাক্সেসরিজ" },
    { href: "/services", label: "সার্ভিস" },
    { href: "/blog", label: "ব্লগ" },
    { href: "/about", label: "আমাদের সম্পর্কে" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
      {/* Top promo strip */}
      <div className="bg-brand text-center text-xs font-medium text-white">
        <div className="container-x flex items-center justify-center gap-1.5 py-1.5">
          <Icon name="Truck" size={13} /> পুরো বাংলাদেশে ফ্রি ডেলিভারি · ৩৬ মাস পর্যন্ত EMI · ১০০% অথেন্টিক
        </div>
      </div>

      <div className="container-x flex items-center gap-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-lg font-bold text-white">A</span>
          <span className="text-lg font-bold text-ink">Apple <span className="text-brand">Network</span></span>
        </Link>

        {/* Search (desktop) */}
        <form action="/search" className="hidden flex-1 md:block">
          <div className="relative">
            <input
              name="q"
              placeholder="ফোন, ব্র্যান্ড বা মডেল খুঁজুন…"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-4 pr-10 text-sm outline-none focus:border-brand focus:bg-white"
            />
            <button className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-brand p-2 text-white" aria-label="সার্চ">
              <Icon name="Search" size={16} />
            </button>
          </div>
        </form>

        {/* Desktop actions */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/track" className="btn-ghost text-sm">ট্র্যাক</Link>
          <Link href="/cart" className="btn-primary relative py-2 text-sm">
            <Icon name="ShoppingCart" size={16} /> কার্ট
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">{count}</span>
            )}
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="ml-auto rounded-md p-2 md:hidden" aria-label="মেনু">
          <Icon name="Menu" size={24} />
        </button>
      </div>

      {/* Desktop category nav */}
      <div className="hidden border-t border-gray-100 md:block">
        <div className="container-x flex items-center gap-6 py-2 text-sm font-medium text-ink-soft">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="transition hover:text-brand">{n.label}</Link>
          ))}
        </div>
      </div>

      {/* Mobile search + drawer */}
      {open && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <div className="container-x space-y-3 py-4">
            <form action="/search">
              <input name="q" placeholder="খুঁজুন…" className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand" />
            </form>
            <nav className="grid grid-cols-2 gap-2">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium">{n.label}</Link>
              ))}
              <Link href="/track" onClick={() => setOpen(false)} className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium">অর্ডার ট্র্যাক</Link>
              <Link href="/cart" onClick={() => setOpen(false)} className="relative rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white">
                কার্ট{count > 0 && <span className="ml-1 inline-grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">{count}</span>}
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
