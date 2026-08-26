// app/admin/stock/page.jsx — inventory browse by Brand -> Models (owner-only).
// Why: owner wanted to pick a Brand and see how many Models exist, then add/edit
// each model's info. So this page lists Brands (with model counts); selecting a
// brand (?brand=) shows that brand's models as cards linking to the edit form.
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

const CONDITION_LABEL = {
  new_official: "নতুন (অফিশিয়াল)",
  new_unofficial: "নতুন (আনঅফিশিয়াল)",
  used_excellent: "প্রিলাভড — Excellent",
  used_good: "প্রিলাভড — Good",
};

export default async function StockBrowse({ searchParams }) {
  const sb = await createClient();
  const activeBrand = searchParams?.brand || null;

  const [{ data: products }, { data: stock }] = await Promise.all([
    sb.from("products").select("id, name, brand, price_bdt, condition, official, category_id, in_stock").order("brand").order("name"),
    sb.from("stock_ledger").select("product_id, qty"),
  ]);
  const stockMap = Object.fromEntries((stock || []).map((s) => [s.product_id, s.qty]));

  // Group by brand.
  const byBrand = {};
  for (const p of products || []) {
    const b = p.brand || "অন্যান্য";
    (byBrand[b] ||= []).push(p);
  }
  const brands = Object.keys(byBrand).sort();

  // If a brand is selected, show its models.
  if (activeBrand) {
    const models = byBrand[activeBrand] || [];
    return (
      <div>
        <div className="flex items-center gap-3">
          <Link href="/admin/stock" className="text-sm text-brand hover:underline">
            ← ব্র্যান্ডসমূহ
          </Link>
          <h1 className="text-2xl font-bold text-ink">{activeBrand}</h1>
          <span className="rounded-full bg-brand-light px-2 py-0.5 text-sm font-medium text-brand-700">
            {models.length} মডেল
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((p) => (
            <Link
              key={p.id}
              href={`/admin/stock/${p.id}`}
              className="rounded-xl border border-gray-100 bg-white p-4 transition hover:shadow-sm"
            >
              <p className="font-semibold text-ink">{p.name}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-ink-soft">
                  {CONDITION_LABEL[p.condition] || p.condition}
                </span>
                {p.official && (
                  <span className="rounded bg-brand-light px-2 py-0.5 font-medium text-brand-700">অফিশিয়াল</span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                <span className="font-semibold text-ink">{taka(p.price_bdt)}</span>
                <span className="text-xs text-ink-muted">স্টক: {stockMap[p.id] ?? 0}</span>
              </div>
              <p className="mt-2 text-xs text-brand">এডিট / তথ্য আপডেট →</p>
            </Link>
          ))}
        </div>
        {!models.length && (
          <p className="mt-6 rounded-lg bg-white p-8 text-center text-sm text-ink-muted">এই ব্র্যান্ডে কোনো মডেল নেই।</p>
        )}
      </div>
    );
  }

  // Default: brand grid with model counts.
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">ইনভেন্টরি (ব্র্যান্ড অনুযায়ী)</h1>
          <p className="mt-1 text-sm text-ink-muted">একটি ব্র্যান্ড বাছাই করুন — কতগুলো মডেল আছে দেখুন ও এডিট করুন।</p>
        </div>
        <Link
          href="/admin/stock/add"
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <Icon name="Plus" size={16} /> নতুন স্টক
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => (
          <Link
            key={b}
            href={`/admin/stock?brand=${encodeURIComponent(b)}`}
            className="rounded-xl border border-gray-100 bg-white p-5 transition hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-ink">{b}</p>
              <Icon name="ChevronRight" size={18} className="text-ink-muted" />
            </div>
            <p className="mt-2 text-sm text-ink-muted">
              <span className="font-semibold text-brand">{byBrand[b].length}</span> টি মডেল
            </p>
          </Link>
        ))}
      </div>
      {!brands.length && (
        <p className="mt-6 rounded-lg bg-white p-8 text-center text-sm text-ink-muted">
          কোনো প্রোডাক্ট নেই। "নতুন স্টক" দিয়ে যোগ করুন।
        </p>
      )}
    </div>
  );
}
