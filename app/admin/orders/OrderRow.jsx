// app/admin/orders/OrderRow.jsx — single order row in the admin orders table.
// Shows full customer/address/payment info, status badge, accumulated pipeline tags,
// the current-step action button, and a delete button.
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus, deleteOrder } from "@/app/actions/orders";
import { taka } from "@/lib/data";

const STEPS = [
  { key: "new",         label: "পেন্ডিং",       btn: "কনফার্ম করুন", color: "bg-gray-400" },
  { key: "confirmed",   label: "কনফার্মড",     btn: "প্যাকিং",       color: "bg-brand" },
  { key: "preparing",   label: "প্যাকিং",       btn: "শিপ করুন",      color: "bg-amber-500" },
  { key: "shipping",    label: "শিপিং",        btn: "ডেলিভার করুন", color: "bg-purple-500" },
  { key: "delivered",   label: "ডেলিভারড",    btn: null,            color: "bg-green-500" },
];
const STEP_INDEX   = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));
const NEXT_STATUS  = { new: "confirmed", confirmed: "preparing", preparing: "shipping", shipping: "delivered" };
const STEP_ORDER   = STEPS.map((s) => s.key);

function conditionLabel(c) {
  return (
    {
      new_official: "নতুন (অফিশিয়াল)",
      new_unofficial: "নতুন (আনঅফিশিয়াল)",
      used_excellent: "ব্যবহৃত (সুন্দর)",
      used_good: "ব্যবহৃত (ভালো)",
    }[c] || c
  );
}

export default function OrderRow({ order, statusLabel, sourceLabel }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(false);

  const stepIdx        = STEP_INDEX[order.status] ?? 0;
  const nextStatus     = NEXT_STATUS[order.status];
  const currentStep    = STEPS[stepIdx];
  const currentBtn     = currentStep?.btn ?? null;
  const shownSteps     = STEP_ORDER.slice(0, stepIdx + 1);
  const isClosed       = order.status === "cancelled" || order.status === "delivered";
  const isPending      = order.status === "new";

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

  // --- Accumulated pipeline tag line ---
  const tagBadgeList = shownSteps.map((key) => {
    const s = STEPS[STEP_INDEX[key]];
    return (
      <span
        key={key}
        className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${s.color}`}
      >
        {s.label}
      </span>
    );
  });

  // --- Items list (collapsible inline, shown as small chips) ---
  const itemsChips = (order.order_items || []).slice(0, 3).map((it, i) => (
    <span key={i} className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-ink-soft">
      {it.product_name}
      <span className="text-ink-muted">×{it.qty}</span>
    </span>
  ));
  const extraItems = (order.order_items || []).length - 3;

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50">
      {/* অর্ডার নম্বর */}
      <td className="py-3 pr-2">
        <p className="font-semibold text-ink">{order.order_number}</p>
        <p className="text-xs text-ink-muted mt-0.5">
          {new Date(order.created_at).toLocaleDateString("bn-BD")}
        </p>
      </td>

      {/* সোর্স */}
      <td className="py-3 pr-3 whitespace-nowrap">
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-ink-soft">
          {sourceLabel[order.source] || order.source}
        </span>
      </td>

      {/* কাস্টমার */}
      <td className="py-3 pr-3 whitespace-nowrap">
        <p className="font-medium text-ink">{order.shipping_name || "—"}</p>
      </td>

      {/* ফোন */}
      <td className="py-3 pr-3 whitespace-nowrap text-ink-soft">
        {order.shipping_phone || "—"}
      </td>

      {/* ঠিকানা */}
      <td className="py-3 pr-3 whitespace-nowrap text-ink-soft text-xs">
        <span className="block max-w-[180px] truncate" title={address || "—"}>
          {address || "—"}
        </span>
      </td>

      {/* পেমেন্ট */}
      <td className="py-3 pr-3 whitespace-nowrap text-ink-soft text-xs">
        <p className="font-medium">{order.payment_method}</p>
        <p className="text-amber-600">{order.payment_status}</p>
      </td>

      {/* টোটাল */}
      <td className="py-3 pr-3 text-right whitespace-nowrap">
        <p className="font-bold text-brand">{taka(order.total_bdt)}</p>
      </td>

      {/* অবস্থা (ব্যাজ) */}
      <td className="py-3 pr-3 whitespace-nowrap">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            isClosed
              ? "bg-gray-100 text-ink-muted"
              : "bg-brand text-white"
          }`}
        >
          {statusLabel[order.status] || order.status}
        </span>
      </td>

      {/* ট্যাগ (accumulated pipeline) */}
      <td className="py-3 pr-3 whitespace-nowrap">
        {tagBadgeList}
        {order.status === "delivered" && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 ml-1">
            💰 বিক্রয়: {taka(order.total_bdt)}
          </span>
        )}
        {order.status === "cancelled" && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 ml-1">
            বাতিল
          </span>
        )}
      </td>

      {/* একশন */}
      <td className="py-3 pr-3">
        <div className="flex flex-col gap-1.5">
          {/* Items preview */}
          {itemsChips.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {itemsChips}
              {extraItems > 0 && (
                <span className="text-xs text-ink-muted">+{extraItems} আরো</span>
              )}
            </div>
          )}

          {/* Note input */}
          {!isClosed && (
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={currentBtn ? `নোট — ${currentBtn}` : "নোট (কাস্টমার দেখবে)"}
              className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs"
            />
          )}

          {/* Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {nextStatus && currentBtn && (
              <button
                disabled={busy}
                onClick={onAdvance}
                className="btn-primary text-xs"
              >
                {busy ? "… চলছে" : currentBtn}
              </button>
            )}
            <button
              disabled={busy || isClosed}
              onClick={onDelete}
              className="ml-auto rounded-lg border border-gray-200 px-2 py-1 text-xs text-ink-soft hover:bg-gray-50"
            >
              🗑 মুছুন
            </button>
          </div>

          {/* Feedback */}
          {err && <p className="text-xs text-red-600">{err}</p>}
          {done && !err && <p className="text-xs text-green-600">আপডেট হয়েছে ✓</p>}
        </div>
      </td>
    </tr>
  );
}
