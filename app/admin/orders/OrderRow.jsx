// app/admin/orders/OrderRow.jsx — single order card with status update (server action)
"use client";
import { useState } from "react";
import { updateOrderStatus } from "@/app/actions/orders";
import { taka } from "@/lib/data";

const NEXT = {
  confirmed: "preparing",
  preparing: "shipping",
  shipping: "delivered",
};
const NEXT_LABEL = { preparing: "প্রস্তুত করুন", shipping: "শিপ করুন", delivered: "ডেলিভার করুন" };

export default function OrderRow({ order, statusLabel }) {
  const [busy, setBusy] = useState(false);
  const next = NEXT[order.status];

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-ink">{order.order_number}</p>
          <p className="text-sm text-ink-soft">{order.shipping_name} · {order.shipping_phone}</p>
          <p className="mt-1 text-xs text-ink-muted">
            {new Date(order.created_at).toLocaleString("bn-BD")} · {order.payment_method} ({order.payment_status})
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-brand">{taka(order.total_bdt)}</p>
          <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand-700">
            {statusLabel[order.status]}
          </span>
        </div>
      </div>

      <div className="mt-3 border-t border-gray-100 pt-3">
        {order.order_items?.map((it, i) => (
          <div key={i} className="flex justify-between text-sm text-ink-soft">
            <span>{it.product_name} × {it.qty}</span>
            <span>{taka(it.unit_price_bdt * it.qty)}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        {next && (
          <button disabled={busy} onClick={async () => { setBusy(true); await updateOrderStatus(order.order_number, next); setBusy(false); }}
            className="btn-primary text-sm">
            {busy ? "…" : NEXT_LABEL[next]}
          </button>
        )}
        {order.status !== "cancelled" && order.status !== "delivered" && (
          <button disabled={busy} onClick={async () => { setBusy(true); await updateOrderStatus(order.order_number, "cancelled"); setBusy(false); }}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
            বাতিল
          </button>
        )}
      </div>
    </div>
  );
}
