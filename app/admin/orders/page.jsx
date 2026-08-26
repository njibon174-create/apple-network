// app/admin/orders/page.jsx — manage customer orders (Phase A)
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import OrderRow from "./OrderRow";

export const dynamic = "force-dynamic";

const STATUS_LABEL = {
  new: "নতুন",
  calling: "কল করা হচ্ছে",
  confirmed: "কনফার্মড",
  preparing: "প্রস্তুত",
  shipping: "শিপিং",
  delivered: "ডেলিভারড",
  cancelled: "বাতিল",
};

const FILTERS = [
  { k: "all", t: "সব" },
  { k: "online", t: "ওয়েবসাইট" },
  { k: "pos", t: "POS (দোকান)" },
];

export default async function AdminOrders({ searchParams }) {
  const src = searchParams?.src || "all";
  const sb = await createClient();
  let q = sb
    .from("orders")
    .select("order_number, status, source, total_bdt, payment_method, payment_status, shipping_name, shipping_phone, created_at, order_items(product_name, qty, unit_price_bdt)");
  if (src !== "all") q = q.eq("source", src);
  const { data: orders } = await q.order("created_at", { ascending: false });

  // counts for the tabs
  const { data: all } = await sb.from("orders").select("source");
  const counts = { all: all?.length ?? 0, online: 0, pos: 0 };
  (all || []).forEach((o) => { if (o.source === "online") counts.online++; else if (o.source === "pos") counts.pos++; });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">অর্ডার ম্যানেজমেন্ট</h1>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <a
            key={f.k}
            href={`/admin/orders?src=${f.k}`}
            className={`rounded-lg border px-3 py-1.5 text-sm ${src === f.k ? "border-brand bg-brand-light text-brand-700" : "border-gray-200 text-ink-soft"}`}
          >
            {f.t} ({counts[f.k] ?? 0})
          </a>
        ))}
      </div>

      <p className="mt-2 text-sm text-ink-muted">{orders?.length ?? 0} টি দেখাচ্ছে</p>

      <div className="mt-4 space-y-3">
        {orders?.map((o) => (
          <OrderRow key={o.order_number} order={o} statusLabel={STATUS_LABEL} />
        ))}
        {!orders?.length && (
          <p className="rounded-lg bg-white p-8 text-center text-sm text-ink-muted">কোনো অর্ডার নেই।</p>
        )}
      </div>
    </div>
  );
}
