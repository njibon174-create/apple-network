"use client";
import { useState } from "react";
import { approveReturn, rejectReturn, processReturn } from "@/app/actions/returns";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";

const STATUS_LABEL = {
  pending: "অপেক্ষায়",
  approved: "অনুমোদিত",
  rejected: "প্রত্যাখ্যান",
  refunded: "রিফান্ড করা হয়েছে",
};
const STATUS_COLOR = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  refunded: "bg-emerald-100 text-emerald-700",
};
const COND_LABEL = {
  new: "নতুন",
  like_new: "অত্যন্ত ভালো",
  good: "ভালো",
  damaged: "ক্ষতিগ্রস্ত",
};

export default function ReturnCard({ ret }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-800">{ret.product_name}</span>
            {ret.customers?.name && (
              <span className="text-xs text-gray-500">
                ({ret.customers.name}{ret.customers.phone ? ` · ${ret.customers.phone}` : ""})
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[ret.status]}`}>
              {STATUS_LABEL[ret.status] || ret.status}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>অর্ডার: {ret.order_number || "—"}</span>
            {ret.reason && <span>কারণ: {ret.reason}</span>}
            <span>কন্ডিশন: {COND_LABEL[ret.condition] || "—"}</span>
            <span>পরিমাণ: ×{ret.qty}</span>
            {ret.refund_bdt > 0 && <span>রিফান্ড: {taka(ret.refund_bdt)}</span>}
            {ret.restock && <span className="text-emerald-600">স্টকে ফেরত: হ্যাঁ</span>}
          </div>
        </div>
        <div className="flex-shrink-0">
          {ret.status === "pending" && <PendingActions ret={ret} />}
          {ret.status === "approved" && <ApprovedActions ret={ret} />}
        </div>
      </div>
    </div>
  );
}

function PendingActions({ ret }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function doAction(kind) {
    setBusy(true);
    setMsg(null);
    const fn = kind === "approve" ? approveReturn : rejectReturn;
    const note = kind === "approve" ? "অনুমোদন করা হয়েছে" : "প্রত্যাখ্যান করা হয়েছে";
    const res = await fn(ret.id, note);
    setBusy(false);
    if (res?.error) {
      setMsg({ kind: "err", text: res.error });
    } else {
      setMsg({ kind: "ok", text: kind === "approve" ? "অনুমোদন করা হয়েছে" : "প্রত্যাখ্যান করা হয়েছে" });
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => doAction("approve")}
        disabled={busy}
        className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
      >
        <Icon name="Check" size={14} /> অনুমোদন
      </button>
      <button
        onClick={() => doAction("reject")}
        disabled={busy}
        className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50"
      >
        <Icon name="X" size={14} /> প্রত্যাখ্যান
      </button>
      {msg && (
        <span className={`text-xs ${msg.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}>
          {msg.text}
        </span>
      )}
    </div>
  );
}

function ApprovedActions({ ret }) {
  const [restockQty, setRestockQty] = useState(ret.qty?.toString() || "1");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function process() {
    setBusy(true);
    setMsg(null);
    const res = await processReturn(ret.id, restockQty);
    setBusy(false);
    if (res?.error) {
      setMsg({ kind: "err", text: res.error });
    } else {
      setMsg({ kind: "ok", text: "রিটার্ন প্রক্রিয়া করা হয়েছে" });
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="1"
        value={restockQty}
        onChange={(e) => setRestockQty(e.target.value)}
        className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-16 text-center focus:outline-none focus:ring-2 focus:ring-emerald-200"
        placeholder="×পিস"
      />
      <button
        onClick={process}
        disabled={busy}
        className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
      >
        <Icon name="ArrowRight" size={14} /> প্রক্রিয়া
      </button>
      {msg && (
        <span className={`text-xs ${msg.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}>
          {msg.text}
        </span>
      )}
    </div>
  );
}
