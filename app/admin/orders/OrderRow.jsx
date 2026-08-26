// app/admin/orders/OrderRow.jsx — redesigned order card with the full pipeline +
// per-step note capture. Each advance writes a note to order_status_log so the
// customer can read the timeline on /track.
"use client";
import { useState } from "react";
import { updateOrderStatus, deleteOrder } from "@/app/actions/orders";
import { taka } from "@/lib/data";

// Pipeline shown to the owner. DB enum stays (new/confirmed/preparing/shipping/delivered).
const STEPS = [
  { key: "new", label: "পেন্ডিং", btn: "কনফার্ম করুন" },
  { key: "confirmed", label: "কনফার্মড", btn: "প্যাকিং শুরু" },
  { key: "preparing", label: "প্যাকিং", btn: "শিপ করুন" },
  { key: "shipping", label: "শিপিং", btn: "ডেলিভার করুন" },
  { key: "delivered", label: "ডেলিভারড", btn: null },
];
const STEP_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));
const NEXT = {
  new: "confirmed",
  confirmed: "preparing",
  preparing: "shipping",
  shipping: "delivered",
};

export default function OrderRow({ order, statusLabel }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(""); // note attached to the NEXT step
  const stepIdx = STEP_INDEX[order.status] ?? 0;
  const next = NEXT[order.status];
  const nextBtn = next ? STEPS[STEP_INDEX[next]].btn : null;
  const isPending = order.status === "new";
  const isClosed = order.status === "cancelled" || order.status === "delivered";

  async function advance() {
    if (!next) return;
    setBusy(true);
    await updateOrderStatus(order.order_number, next, note.trim() || null);
    setNote("");
    setBusy(false);
  }
  async function cancel() {
    setBusy(true);
    await updateOrderStatus(order.order_number, "cancelled", note.trim() || "মালিক বাতিল করেছেন");
    setBusy(false);
  }
  async function del() {
    if (!confirm(`অর্ডার ${order.order_number} মুছে ফেলবেন?`)) return;
    setBusy(true);
    await deleteOrder(order.order_number);
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
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isClosed ? "bg-gray-100 text-ink-muted" : "bg-brand-light text-brand-700"}`}>
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

      {/* Pipeline progress */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s.key}
            className={`rounded px-2 py-0.5 text-xs ${i <= stepIdx ? "bg-brand text-white" : "bg-gray-100 text-ink-muted"}`}
          >
            {i + 1}. {s.label}
          </span>
        ))}
        {order.status === "cancelled" && <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">বাতিল</span>}
      </div>

      {/* Per-step note + action row */}
      <div className="mt-3 flex flex-col gap-2">
        {!isClosed && (
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={next ? `${STEPS[STEP_INDEX[next]].label} স্টেপের জন্য নোট (কাস্টমার দেখবে)` : "বাতিলের কারণ লিখুন"}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
          />
        )}
        <div className="flex flex-wrap gap-2">
          {nextBtn && (
            <button disabled={busy} onClick={advance} className="btn-primary text-sm">
              {busy ? "…" : nextBtn}
            </button>
          )}
          {isPending && (
            <button disabled={busy} onClick={cancel} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
              বাতিল করুন
            </button>
          )}
          <button disabled={busy} onClick={del} className="ml-auto rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-ink-soft hover:bg-gray-50">
            🗑 মুছুন
          </button>
        </div>
      </div>
    </div>
  );
}
