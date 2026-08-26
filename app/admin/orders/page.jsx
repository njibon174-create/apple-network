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

export default async function AdminOrders() {
  const sb = await createClient();
  const { data: orders } = await sb
    .from("orders")
    .select("order_number, status, total_bdt, payment_method, payment_status, shipping_name, shipping_phone, created_at, order_items(product_name, qty, unit_price_bdt)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">অর্ডার ম্যানেজমেন্ট</h1>
      <p className="mt-1 text-sm text-ink-muted">{orders?.length ?? 0} টি অর্ডার</p>

      <div className="mt-6 space-y-3">
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
