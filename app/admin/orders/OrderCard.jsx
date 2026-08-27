"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus, deleteOrder } from "@/app/actions/orders";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";

// Pipeline steps with their label, button action, and color.
const STEPS = [
  { key: "new",         label: "পেন্ডিং",       btn: "কনফার্ম করুন", color: "bg-gray-400" },
  { key: "confirmed",   label: "কনফার্মড",     btn: "প্যাকিং",       color: "bg-brand" },
  { key: "preparing",   label: "প্যাকিং",       btn: "শিপ করুন",      color: "bg-amber-500" },
  { key: "shipping",    label: "শিপিং",        btn: "ডেলিভার করুন", color: "bg-purple-500" },
  { key: "delivered",   label: "ডেলিভারড",    btn: null,            color: "bg-green-500" },
];
const STEP_INDEX   = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));
const NEXT_STATUS  = { new: "confirmed", confirmed: "preparing", preparing: "shipping", shipping: "delivered" };
const STEP_ORDER   = STEPS.map((s) => s.key); // pipeline order for accumulated tags

export default function OrderCard({ order, statusLabel, sourceLabel }) {
  const router     = useRouter();
  const [busy,   startTransition] = useTransition();
  const [note,   setNote]     = useState("");
  const [err,    setErr]      = useState(null);
  const [done,   setDone]     = useState(false);

  const stepIdx        = STEP_INDEX[order.status] ?? 0;
  const nextStatus     = NEXT_STATUS[order.status];
  const currentStep    = STEPS[stepIdx];
  const currentBtn     = currentStep?.btn ?? null;
  const shownSteps     = STEP_ORDER.slice(0, stepIdx + 1); // accumulated: 1..stepIdx+1
  const isPending      = order.status === "new";
  const isClosed       = order.status === "cancelled" || order.status === "delivered";

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
    if (!nextStatus) return;
    run(() => updateOrderStatus(order.order_number, nextStatus, note.trim() || null));
    setNote("");
  }

  function onDelete() {
    if (!confirm(`অর্ডার ${order.order_number} মুছে ফেলবেন?`)) return;
    run(() => deleteOrder(order.order_number));
  }

  const address = [
    order.shipping_address,
    order.shipping_city,
    order.shipping_division,
  ].filter(Boolean).join(", ");

  // --- Status badge ---
  const statusBadgeClass = isClosed
    ? "bg-gray-100 text-ink-muted"
    : "bg-brand text-white";

  // --- Accumulated pipeline tag line: "১. পেন্ডিং · ২. কনফার্মড · ..." ---
  const tagLine = shownSteps
    .map((key, idx) => {
      const s = STEPS[STEP_INDEX[key]];
      return `${idx + 1}. ${s.label}`;
    })
    .join("  ·  ");

  // --- Items list ---
  const items = (order.order_items || []).map((it, i) => (
    <div key={i} className="flex items-center gap-3 py-1 text-sm">
      <span className="grid h-9 w-9 flex-none place-items-center overflow-hidden rounded-md bg-gray-100 text-ink-muted">
        <Icon name="Package" size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{it.product_name}</p>
        <p className="text-xs text-ink-muted">
          {[it.color, it.storage, it.ram].filter(Boolean).join(" · ")}
        </p>
      </div>
      <span className="text-ink-muted">×{it.qty}</span>
      <span className="font-medium text-ink">{taka(it.unit_price_bdt)}</span>
    </div>
  ));

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
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass}`}>
            {statusLabel[order.status] || order.status}
          </span>
        </div>
      </div>

      {/* Customer details */}
      <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
        <p className="mb-1 font-semibold text-ink">👤 কাস্টমার</p>
        <p className="text-ink-soft">
          <span className="text-ink-muted">নাম:</span> {order.shipping_name || "—"}
        </p>
        <p className="text-ink-soft">
          <span className="text-ink-muted">ফোন:</span> {order.shipping_phone || "—"}
        </p>
        {order.shipping_email && (
          <p className="text-ink-soft">
            <span className="text-ink-muted">ইমেইল:</span> {order.shipping_email}
          </p>
        )}
        <p className="text-ink-soft">
          <span className="text-ink-muted">ঠিকানা:</span> {address || "—"}
        </p>
        <p className="mt-1 text-ink-soft">
          <span className="text-ink-muted">পেমেন্ট:</span> {order.payment_method} ({order.payment_status})
        </p>
      </div>

      {/* Items */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <p className="mb-1 text-xs font-semibold uppercase text-ink-muted">📦 আইটেম</p>
        {items}
      </div>

      {/* Accumulated pipeline tags + delivery/sell tags */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {tagLine && <span className="text-xs text-ink-muted">{tagLine}</span>}
        {order.status === "delivered" && (
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            💰 বিক্রয়: {taka(order.total_bdt)}
          </span>
        )}
        {order.status === "cancelled" && (
          <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">বাতিল</span>
        )}
      </div>

      {/* Status log notes */}
      {(order.order_status_log || []).length > 0 && (
        <div className="mt-2 rounded-lg bg-gray-50 p-2 text-xs text-ink-soft">
          {order.order_status_log
            .slice()
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .map((l, i) => (
              <p key={i}>
                📝 {l.note || l.to_status} <span className="text-ink-muted">
                  ({new Date(l.created_at).toLocaleString("bn-BD")})
                </span>
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
            placeholder={currentBtn ? `${currentBtn} — এই স্টেপের নোট` : "নোট (কাস্টমার দেখবে)"}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
          />
        )}
        <div className="flex flex-wrap gap-2">
          {nextStatus && currentBtn && (
            <button
              disabled={busy}
              onClick={onAdvance}
              className="btn-primary text-sm"
            >
              {busy ? "… চলছে" : currentBtn}
            </button>
          )}
          <button
            disabled={busy || isClosed}
            onClick={onDelete}
            className="ml-auto rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-ink-soft hover:bg-gray-50"
          >
            🗑 মুছুন
          </button>
        </div>
        {err && <p className="rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">{err}</p>}
        {done && !err && (
          <p className="rounded-lg bg-green-50 px-3 py-1.5 text-xs text-green-700">আপডেট হয়েছে ✓</p>
        )}
      </div>
    </div>
  );
}
