// app/search/page.jsx — PAGE 15: Search Results (client-side, live Supabase)
"use client";
import Link from "next/link";
import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { PRODUCTS } from "@/lib/data";
import { createClient } from "@supabase/auth-helpers-nextjs";

function normalize(row) {
  const storage = Array.isArray(row.storages) && row.storages.length ? row.storages[0] : undefined;
  const ram = Array.isArray(row.rams) && row.rams.length ? row.rams[0] : undefined;
  return {
    slug: row.slug, name: row.name, brand: row.brand, category: row.category_slug,
    price: row.price_bdt, regularPrice: row.regular_price_bdt ?? null,
    storage, ram, badge: row.badge ?? null, emiFrom: row.emi_from_bdt ?? null,
    inStock: row.in_stock, rating: row.rating ?? 0, reviews: row.review_count ?? 0,
    image: row.image_primary,
  };
}

function SearchInner() {
  const params = useSearchParams();
  const initial = params.get("q") || "";
  const [q, setQ] = useState(initial);
  const [all, setAll] = useState(PRODUCTS);

  useEffect(() => {
    let active = true;
    const url = process.env.NEXT_SUPABASE_URL;
    const key = process.env.NEXT_SUPABASE_ANON_KEY;
    if (!url || !key) return; // fallback to sample data
    (async () => {
      try {
        const sb = createClient(url, key);
        const { data, error } = await sb.from("v_products_full").select("*");
        if (!error && data && active) setAll(data.map(normalize));
      } catch {}
    })();
    return () => { active = false; };
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return all;
    return all.filter((p) =>
      [p.name, p.brand, p.category].join(" ").toLowerCase().includes(term)
    );
  }, [q, all]);

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
