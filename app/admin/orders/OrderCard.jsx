"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus, cancelOrder, deleteOrder } from "@/app/actions/orders";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";

// Pipeline shown to the owner. DB enum stays (new/confirmed/preparing/shipping/delivered).
const STEPS = [
  { key: "new", label: "পেন্ডিং", btn: "কনফার্ম করুন" },
  { key: "confirmed", label: "কনফার্মড", btn: "প্যাকিং শুরু" },
  { key: "preparing", label: "প্যাকিং", btn: "শিপ করুন" },
  { key: "shipping", label: "শিপিং", btn: "ডেলিভার করুন" },
  { key: "delivered", label: "ডেলিভারড", btn: null },
];
const STEP_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));
const NEXT = { new: "confirmed", confirmed: "preparing", preparing: "shipping", shipping: "delivered" };

function conditionLabel(c) {
  return (
    { new_official: "নতুন (অফিশিয়াল)", new_unofficial: "নতুন (আনঅফিশিয়াল)", used_excellent: "ব্যবহৃত (সুন্দর)", used_good: "ব্যবহৃত (ভালো)" }[c] || c
  );
}

export default function OrderCard({ order, statusLabel, sourceLabel }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(false);

  const stepIdx = STEP_INDEX[order.status] ?? 0;
  const next = NEXT[order.status];
  const nextBtn = next ? STEPS[STEP_INDEX[next]].btn : null;
  const isPending = order.status === "new";
  const isClosed = order.status === "cancelled" || order.status === "delivered";

  function run(fn) {
    setErr(null);
    setDone(false);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) setErr(res.error);
      else setDone(true);
      router.refresh();
    });
  }

  function onAdvance() {
    if (!next) return;
    run(() => updateOrderStatus(order.order_number, next, note.trim() || null));
    setNote("");
  }
  function onCancel() {
    run(() => cancelOrder(order.order_number, note.trim() || "মালিক বাতিল করেছেন"));
  }
  function onDelete() {
    if (!confirm(`অর্ডার ${order.order_number} মুছে ফেলবেন?`)) return;
    run(() => deleteOrder(order.order_number));
  }

  const address = [order.shipping_address, order.shipping_city, order.shipping_division]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="rounded-xl2 border border-gray-100 bg-white p-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-ink">{order.order_number}</p>
          <p className="text-xs text-ink-muted">
            {new Date(order.created_at).toLocaleString("bn-BD")}
            {order.source && ` · ${sourceLabel[order.source] || order.source}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-brand">{taka(order.total_bdt)}</p>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isClosed ? "bg-gray-100 text-ink-muted" : "bg-brand-light text-brand-700"}`}>
            {statusLabel[order.status] || order.status}
          </span>
        </div>
      </div>

      {/* Customer full details */}
      <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
        <p className="mb-1 font-semibold text-ink">👤 কাস্টমার</p>
        <p className="text-ink-soft"><span className="text-ink-muted">নাম:</span> {order.shipping_name || "—"}</p>
        <p className="text-ink-soft"><span className="text-ink-muted">ফোন:</span> {order.shipping_phone || "—"}</p>
        {order.shipping_email && <p className="text-ink-soft"><span className="text-ink-muted">ইমেইল:</span> {order.shipping_email}</p>}
        <p className="text-ink-soft"><span className="text-ink-muted">ঠিকানা:</span> {address || "—"}</p>
        <p className="mt-1 text-ink-soft">
          <span className="text-ink-muted">পেমেন্ট:</span> {order.payment_method} ({order.payment_status})
        </p>
      </div>

      {/* Items */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <p className="mb-1 text-xs font-semibold uppercase text-ink-muted">📦 আইটেম</p>
        {(order.order_items || []).map((it, i) => (
          <div key={i} className="flex items-center gap-3 py-1 text-sm">
            <span className="grid h-9 w-9 flex-none place-items-center overflow-hidden rounded-md bg-gray-100 text-ink-muted">
              <Icon name="Package" size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{it.product_name}</p>
              <p className="text-xs text-ink-muted">
                {[it.color, it.storage, it.ram, conditionLabel(it.condition)].filter(Boolean).join(" · ")}
              </p>
            </div>
            <span className="text-ink-muted">×{it.qty}</span>
            <span className="font-medium text-ink">{taka(it.unit_price_bdt)}</span>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {STEPS.map((s, i) => (
          <span key={s.key} className={`rounded px-2 py-0.5 text-xs ${i <= stepIdx ? "bg-brand text-white" : "bg-gray-100 text-ink-muted"}`}>
            {i + 1}. {s.label}
          </span>
        ))}
        {order.status === "cancelled" && <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">বাতিল</span>}
      </div>

      {/* Notes already recorded */}
      {(order.order_status_log || []).length > 0 && (
        <div className="mt-2 rounded-lg bg-gray-50 p-2 text-xs text-ink-soft">
          {order.order_status_log
            .slice()
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .map((l, i) => (
              <p key={i}>
                📝 {l.note || l.to_status} <span className="text-ink-muted">({new Date(l.created_at).toLocaleString("bn-BD")})</span>
              </p>
            ))}
        </div>
      )}

      {/* Action row */}
      <div className="mt-3 flex flex-col gap-2">
        {!isClosed && (
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={next ? `${STEPS[STEP_INDEX[next]].label} স্টেপের নোট (কাস্টমার দেখবে)` : "বাতিলের কারণ"}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
          />
        )}
        <div className="flex flex-wrap gap-2">
          {nextBtn && (
            <button disabled={busy} onClick={onAdvance} className="btn-primary text-sm">
              {busy ? "…" : nextBtn}
            </button>
          )}
          {isPending && (
            <button disabled={busy} onClick={onCancel} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
              বাতিল করুন
            </button>
          )}
          <button disabled={busy} onClick={onDelete} className="ml-auto rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-ink-soft hover:bg-gray-50">
            🗑 মুছুন
          </button>
        </div>
        {err && <p className="rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">{err}</p>}
        {done && !err && <p className="rounded-lg bg-green-50 px-3 py-1.5 text-xs text-green-700">আপডেট হয়েছে ✓</p>}
      </div>
    </div>
  );
}
