// app/search/page.jsx — PAGE 15: Search Results (client-side filter over sample data)
"use client";
import Link from "next/link";
import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { PRODUCTS } from "@/lib/data";

function SearchInner() {
  const params = useSearchParams();
  const initial = params.get("q") || "";
  const [q, setQ] = useState(initial);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return PRODUCTS;
    return PRODUCTS.filter((p) =>
      [p.name, p.brand, p.category].join(" ").toLowerCase().includes(term)
    );
  }, [q]);

  return (
    <div className="container-x mt-6">
      <h1 className="text-2xl font-bold text-ink">সার্চ</h1>
      <div className="mt-4 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ফোন, ব্র্যান্ড বা মডেল খুঁজুন…" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand" />
      </div>

      <p className="mt-4 text-sm text-ink-muted">
        {q ? <>&quot;{q}&quot; — </> : null}{results.length.toLocaleString("bn-BD")}টি ফলাফল
      </p>

      {results.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      ) : (
        <div className="mt-8 rounded-xl2 bg-gray-50 p-8 text-center">
          <p className="text-ink-soft">এই নামে কিছু খুঁজে পাওয়া গেল না।</p>
          <p className="mt-1 text-sm text-ink-muted">ব্র্যান্ড + মডেল লিখে চেষ্টা করুন, অথবা</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/category/phones" className="btn-secondary">সব ফোন দেখুন</Link>
            <Link href="/contact" className="btn-ghost">চ্যাট করুন</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-x mt-10 text-center text-ink-muted">লোড হচ্ছে…</div>}>
      <SearchInner />
    </Suspense>
  );
}
