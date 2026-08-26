// app/admin/orders/OrderRow.jsx — single order card with lifecycle pipeline (server action)
"use client";
import { useState } from "react";
import { updateOrderStatus, logCall, deleteOrder } from "@/app/actions/orders";
import { taka } from "@/lib/data";

const STEPS = [
  { key: "new", label: "নতুন" },
  { key: "calling", label: "কল" },
  { key: "confirmed", label: "কনফার্ম" },
  { key: "preparing", label: "প্যাকিং" },
  { key: "shipping", label: "শিপিং" },
  { key: "delivered", label: "ডেলিভার" },
];
const STEP_LABEL = Object.fromEntries(STEPS.map((s) => [s.key, s.label]));
const NEXT = {
  new: "calling",
  calling: "confirmed",
  confirmed: "preparing",
  preparing: "shipping",
  shipping: "delivered",
};
const NEXT_BTN = {
  calling: "কনফার্ম করুন",
  confirmed: "প্যাক করুন",
  preparing: "শিপ করুন",
  shipping: "ডেলিভার করুন",
};

export default function OrderRow({ order, statusLabel }) {
  const [busy, setBusy] = useState(false);
  const [callNote, setCallNote] = useState("");
  const stepIdx = STEPS.findIndex((s) => s.key === order.status);

  async function del() {
    if (!confirm(`অর্ডার ${order.order_number} মুছে ফেলবেন?`)) return;
    setBusy(true);
    await deleteOrder(order.order_number);
    setBusy(false);
  }

  async function advance() {
    const next = NEXT[order.status];
    if (!next) return;
    setBusy(true);
    await updateOrderStatus(order.order_number, next);
    setBusy(false);
  }
  async function callNow() {
    setBusy(true);
    await logCall(order.order_number, callNote || null);
    setBusy(false);
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-ink">{order.order_number}</p>
          <p className="text-sm text-ink-soft">{order.shipping_name} · {order.shipping_phone}</p>
          <p className="mt-1 text-xs text-ink-muted">
            {new Date(order.created_at).toLocaleString("bn-BD")} · {order.payment_method} ({order.payment_status})
            {order.source === "pos" && " · POS"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-brand">{taka(order.total_bdt)}</p>
          <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand-700">
            {statusLabel[order.status] || order.status}
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

      {/* Lifecycle pipeline */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s.key}
            className={`rounded px-2 py-0.5 text-xs ${
              i <= stepIdx ? "bg-brand text-white" : "bg-gray-100 text-ink-muted"
            }`}
          >
            {i + 1}. {s.label}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {order.status === "new" && (
          <div className="flex flex-1 items-center gap-1">
            <input
              value={callNote}
              onChange={(e) => setCallNote(e.target.value)}
              placeholder="কল নোট (ঐচ্ছিক)"
              className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
            />
            <button disabled={busy} onClick={callNow} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
              📞 কল করুন
            </button>
          </div>
        )}
        {NEXT[order.status] && (
          <button disabled={busy} onClick={advance} className="btn-primary text-sm">
            {busy ? "…" : NEXT_BTN[order.status]}
          </button>
        )}
        {order.status !== "cancelled" && order.status !== "delivered" && (
          <button
            disabled={busy}
            onClick={async () => { setBusy(true); await updateOrderStatus(order.order_number, "cancelled"); setBusy(false); }}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            বাতিল
          </button>
        )}
        <button
          disabled={busy}
          onClick={del}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-ink-soft hover:bg-gray-50"
        >
          🗑 মুছুন
        </button>
      </div>
    </div>
  );
}
