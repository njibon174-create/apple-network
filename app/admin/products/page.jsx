// app/admin/products/page.jsx — product management list (with upcoming section).
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
  const [{ data: products }, { data: stock }, { data: cats }, { data: brands }] =
    await Promise.all([
      sb.from("products").select("*, brands(name_bn, name_en), models(name_bn, name_en)").order("name"),
      sb.from("stock_ledger").select("product_id, qty"),
      sb.from("categories").select("id, name_bn").order("name_bn"),
      sb.from("brands").select("id, name_bn, name_en").order("sort_order"),
    ]);

  const stockMap = Object.fromEntries((stock || []).map((s) => [s.product_id, s.qty]));
  const catMap = Object.fromEntries((cats || []).map((c) => [c.id, c.name_bn]));
  const brandMap = Object.fromEntries((brands || []).map((b) => [b.id, b]));

  const inStock = (products || []).filter((p) => p.in_stock && !p.upcoming);
  const upcoming = (products || []).filter((p) => !!p.upcoming);
  const outOfStock = (products || []).filter((p) => !p.in_stock && !p.upcoming);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">প্রোডাক্ট ম্যানেজমেন্ট</h1>
          <p className="mt-1 text-sm text-ink-muted">{products?.length ?? 0} টি প্রোডাক্ট</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            <Icon name="Plus" size={16} /> নতুন প্রোডাক্ট
          </Link>
          <Link
            href="/admin/products/request"
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-gray-50"
          >
            <Icon name="Mail" size={16} /> রিকোয়েস্ট প্রোডাক্ট
          </Link>
        </div>
      </div>

      {/* Upcoming section */}
      {upcoming.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink">
            <Icon name="Clock" size={20} /> আগামী প্রোডাক্টসমূহ
            <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              {upcoming.length}
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((p) => renderProductCard(p, stockMap, catMap, brandMap))}
          </div>
        </section>
      )}

      {/* In-stock section */}
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-ink">
          স্টকে আছে
          <span className="ml-2 rounded bg-accent-teal-50 px-2 py-0.5 text-xs font-medium text-accent-teal-700">
            {inStock.length}
          </span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inStock.map((p) => renderProductCard(p, stockMap, catMap, brandMap))}
        </div>
      </section>

      {/* Out-of-stock section */}
      {outOfStock.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-ink">
            স্টক নেই
            <span className="ml-2 rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
              {outOfStock.length}
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {outOfStock.map((p) => renderProductCard(p, stockMap, catMap, brandMap))}
          </div>
        </section>
      )}

      {!products?.length && (
        <p className="mt-6 rounded-lg bg-white p-8 text-center text-sm text-ink-muted">
          কোনো প্রোডাক্ট নেই।
        </p>
      )}
    </div>
  );
}

function renderProductCard(p, stockMap, catMap, brandMap) {
  const brand = p.brand_id ? brandMap[p.brand_id] : null;
  const model = p.model_id ? { name_bn: p.models?.name_bn, name_en: p.models?.name_en } : null;

  return (
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
          <p className="mt-0.5 text-xs text-ink-muted">
            {brand ? `${brand.name_bn} / ${model?.name_bn || brand.name_bn}` : (p.brand || "—")}
          </p>
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
        {p.upcoming && (
          <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
            আগামী
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
          {p.upcoming && p.expected_price_bdt ? (
            <span className="ml-2 text-xs text-amber-600">
              প্রত্যাশিত: {taka(p.expected_price_bdt)}
            </span>
          ) : null}
          <span className="ml-2 text-xs text-ink-muted">
            স্টক: {stockMap[p.id] ?? 0}
          </span>
        </div>
        <span
          className={`text-xs font-medium ${p.in_stock ? "text-accent-teal" : "text-red-500"}`}
        >
          {p.upcoming ? "আগামী" : p.in_stock ? "স্টকে আছে" : "স্টক নেই"}
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
  );
}
