// app/admin/products/page.jsx — product management list (Phase B)
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";
import DeleteProductButton from "@/components/admin/DeleteProductButton";

export const dynamic = "force-dynamic";

const CONDITION_LABEL = {
  new_official: "নতুন (অফিশিয়াল)",
  new_unofficial: "নতুন (আনঅফিশিয়াল)",
  used_excellent: "প্রিলাভড — Excellent",
  used_good: "প্রিলাভড — Good",
};

export default async function AdminProducts() {
  const sb = await createClient();
  const [{ data: products }, { data: stock }, { data: cats }] = await Promise.all([
    sb.from("products").select("*, categories(name_bn)").order("name"),
    sb.from("stock_ledger").select("product_id, qty"),
    sb.from("categories").select("id, name_bn").order("name_bn"),
  ]);

  const stockMap = Object.fromEntries((stock || []).map((s) => [s.product_id, s.qty]));
  const catMap = Object.fromEntries((cats || []).map((c) => [c.id, c.name_bn]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">প্রোডাক্ট ম্যানেজমেন্ট</h1>
          <p className="mt-1 text-sm text-ink-muted">{products?.length ?? 0} টি প্রোডাক্ট</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <Icon name="Plus" size={16} /> নতুন প্রোডাক্ট
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products?.map((p) => (
          <div key={p.id} className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="flex gap-3">
              {p.image_primary ? (
                <img
                  src={p.image_primary}
                  alt={p.name}
                  className="h-16 w-16 flex-none rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 flex-none items-center justify-center rounded-lg bg-gray-100 text-brand">
                  <Icon name="Package" size={24} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{p.name}</p>
                {p.name_bn && <p className="truncate text-xs text-ink-muted">{p.name_bn}</p>}
                <p className="mt-0.5 text-xs text-ink-muted">{p.brand || "—"}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="rounded bg-gray-100 px-2 py-0.5 text-ink-soft">
                {CONDITION_LABEL[p.condition] || p.condition}
              </span>
              {p.official && (
                <span className="rounded bg-brand-light px-2 py-0.5 font-medium text-brand-700">
                  অফিশিয়াল
                </span>
              )}
              {catMap[p.category_id] && (
                <span className="rounded bg-gray-100 px-2 py-0.5 text-ink-muted">
                  {catMap[p.category_id]}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
              <div className="text-sm">
                <span className="font-semibold text-ink">{taka(p.price_bdt)}</span>
                <span className="ml-2 text-xs text-ink-muted">
                  স্টক: {stockMap[p.id] ?? 0}
                </span>
              </div>
              <span
                className={`text-xs font-medium ${p.in_stock ? "text-accent-teal" : "text-red-500"}`}
              >
                {p.in_stock ? "স্টকে আছে" : "স্টক নেই"}
              </span>
            </div>

            <div className="mt-3 flex gap-2">
              <Link
                href={`/admin/products/${p.id}`}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-gray-50"
              >
                <Icon name="FileEdit" size={14} /> এডিট
              </Link>
              <DeleteProductButton id={p.id} />
            </div>
          </div>
        ))}
      </div>

      {!products?.length && (
        <p className="mt-6 rounded-lg bg-white p-8 text-center text-sm text-ink-muted">
          কোনো প্রোডাক্ট নেই।
        </p>
      )}
    </div>
  );
}
