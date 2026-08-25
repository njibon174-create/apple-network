// components/ProductFilter.jsx
// Why: reusable, fully-functional catalog filter. Receives the already-loaded
// product list (from Supabase) and filters client-side by category/brand/condition/
// price/stock, plus a sort. Keeps filters instant with no extra server round-trips.
"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES, BRANDS } from "@/lib/data";
import Icon from "@/components/Icon";

const CONDITIONS = [
  { key: "new", label: "নতুন", test: (p) => p.condition && p.condition.startsWith("new") },
  { key: "used", label: "প্রিলাভড", test: (p) => p.condition && p.condition.startsWith("used") },
];

const SORTS = [
  { key: "popular", label: "জনপ্রিয়তা" },
  { key: "price-asc", label: "দাম: কম → বেশি" },
  { key: "price-desc", label: "দাম: বেশি → কম" },
  { key: "newest", label: "নতুন আগত" },
];

const PRICE_RANGES = [
  { key: "all", label: "সব দাম", min: 0, max: Infinity },
  { key: "0-5000", label: "৳৫,০০০ এর নিচে", min: 0, max: 5000 },
  { key: "5000-15000", label: "৳৫,০০০ – ১৫,০০০", min: 5000, max: 15000 },
  { key: "15000-40000", label: "৳১৫,০০০ – ৪০,০০০", min: 15000, max: 40000 },
  { key: "40000+", label: "৳৪০,০০০+", min: 40000, max: Infinity },
];

export default function ProductFilter({ products, isPhones = false, hideCategory = false }) {
  const [selCats, setSelCats] = useState([]); // multi-category (shop only)
  const [selBrands, setSelBrands] = useState([]);
  const [selCond, setSelCond] = useState([]); // "new" | "used"
  const [priceKey, setPriceKey] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("popular");

  const brands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand).filter(Boolean));
    return [...set].sort();
  }, [products]);

  const toggle = (setter) => (val) =>
    setter((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));

  const filtered = useMemo(() => {
    const range = PRICE_RANGES.find((r) => r.key === priceKey) || PRICE_RANGES[0];
    let out = products.filter((p) => {
      if (selCats.length && !selCats.includes(p.category)) return false;
      if (selBrands.length && !selBrands.includes(p.brand)) return false;
      if (selCond.length) {
        const isUsed = p.condition && p.condition.startsWith("used");
        const wantUsed = selCond.includes("used");
        const wantNew = selCond.includes("new");
        if (wantUsed && !isUsed) return false;
        if (wantNew && isUsed) return false;
      }
      if (p.price < range.min || p.price > range.max) return false;
      if (inStockOnly && !p.inStock) return false;
      return true;
    });
    switch (sort) {
      case "price-asc": out = [...out].sort((a, b) => a.price - b.price); break;
      case "price-desc": out = [...out].sort((a, b) => b.price - a.price); break;
      case "newest": out = [...out].sort((a, b) => (b.reviews || 0) - (a.reviews || 0)); break;
      default: out = [...out].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return out;
  }, [products, selCats, selBrands, selCond, priceKey, inStockOnly, sort]);

  const reset = () => {
    setSelCats([]); setSelBrands([]); setSelCond([]);
    setPriceKey("all"); setInStockOnly(false); setSort("popular");
  };

  const activeCount = selCats.length + selBrands.length + selCond.length + (priceKey !== "all" ? 1 : 0) + (inStockOnly ? 1 : 0);

  return (
    <div className="container-x mt-6 flex flex-col gap-6 lg:flex-row">
      {/* Sidebar filters */}
      <aside className="lg:w-60 lg:shrink-0">
        <div className="rounded-lg border border-gray-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">ফিল্টার</h2>
            {activeCount > 0 && (
              <button onClick={reset} className="text-xs text-brand hover:underline">রিসেট</button>
            )}
          </div>

          {!hideCategory && (
            <FilterBlock title="ক্যাটাগরি">
              {CATEGORIES.map((c) => (
                <CheckRow key={c.slug} label={c.name} checked={selCats.includes(c.slug)} onChange={() => toggle(setSelCats)(c.slug)} />
              ))}
            </FilterBlock>
          )}

          {isPhones && (
            <FilterBlock title="কন্ডিশন">
              {CONDITIONS.map((c) => (
                <CheckRow key={c.key} label={c.label} checked={selCond.includes(c.key)} onChange={() => toggle(setSelCond)(c.key)} />
              ))}
            </FilterBlock>
          )}

          {brands.length > 0 && (
            <FilterBlock title="ব্র্যান্ড">
              {brands.map((b) => (
                <CheckRow key={b} label={b} checked={selBrands.includes(b)} onChange={() => toggle(setSelBrands)(b)} />
              ))}
            </FilterBlock>
          )}

          <FilterBlock title="দামের পরিসর">
            <div className="space-y-1.5">
              {PRICE_RANGES.map((r) => (
                <label key={r.key} className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
                  <input type="radio" name="price" checked={priceKey === r.key} onChange={() => setPriceKey(r.key)} className="accent-brand" /> {r.label}
                </label>
              ))}
            </div>
          </FilterBlock>

          <div className="mt-2 border-t border-gray-100 pt-3">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="accent-brand" /> শুধু স্টকে আছে
            </label>
          </div>
        </div>
      </aside>

      {/* Grid + sort */}
      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-ink-muted">{filtered.length.toLocaleString("bn-BD")}টি প্রোডাক্ট</p>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-ink-soft outline-none">
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>

        {filtered.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((p) => <ProductCard key={p.slug} p={p} />)}
          </div>
        ) : (
          <p className="rounded-lg bg-gray-50 p-8 text-center text-sm text-ink-muted">কোনো প্রোডাক্ট মেলেনি। ফিল্টার পরিবর্তন করে দেখুন।</p>
        )}
      </div>
    </div>
  );
}

function FilterBlock({ title, children }) {
  return (
    <div className="mb-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
      <p className="mb-2 text-xs font-semibold text-ink-soft">{title}</p>
      {children}
    </div>
  );
}

function CheckRow({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-ink-soft">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-brand" /> {label}
    </label>
  );
}
