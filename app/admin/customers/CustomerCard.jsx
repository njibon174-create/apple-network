// app/admin/customers/CustomerCard.jsx — client card with "Record Payment" action.
"use client";
import { useState } from "react";
import { recordCustomerPayment } from "@/app/actions/customers";
import { taka } from "@/lib/data";

const TYPE_LABEL = { "walk-in": "ওয়াক-ইন", credit: "ক্রেডিট", emi: "ইমি" };
const TYPE_COLOR = {
  "walk-in": "bg-gray-100 text-ink-muted",
  credit: "bg-amber-100 text-amber-700",
  emi: "bg-blue-100 text-blue-700",
};

const overdueDays = (dueDate) => {
  if (!dueDate) return null;
  const diff = Math.floor((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
};

export default function CustomerCard({ c }) {
  const [busy, setBusy] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState(null);

  const orders = c.orders || [];
  const spent = orders.reduce((s, o) => s + (o.total_bdt || 0), 0);
  const paidOrders = orders.filter((o) => o.payment_status === "paid").length;
  const pendingOrders = orders.filter(
    (o) => o.payment_status !== "paid" && (o.payment_method === "bkash" || o.payment_method === "nagad" || o.payment_method === "card")
  ).length;

  const credits = c.credit_sales || [];
  const totalDue = credits.reduce((s, cr) => s + (cr.total_due - cr.amount_paid), 0);
  const overdue = credits.map((cr) => overdueDays(cr.due_date)).filter((d) => d !== null);
  const maxOverdue = overdue.length ? Math.max(...overdue) : 0;
  const isLatePayer = maxOverdue > 7 || pendingOrders > 0 || totalDue > 0;

  async function pay() {
    setBusy(true);
    setMsg(null);
    const res = await recordCustomerPayment(c.id, amount);
    setBusy(false);
    if (res?.error) setMsg(res.error);
    else {
      setMsg(`পেমেন্ট রেকর্ড হয়েছে: ${taka(res.applied)}${res.remaining > 0 ? ` (বাকি থাকলো ${taka(res.remaining)})` : ""}`);
      setAmount("");
      setShowPay(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-ink">{c.name || "—"}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[c.type] || TYPE_COLOR["walk-in"]}`}>
              {TYPE_LABEL[c.type] || c.type}
            </span>
            {isLatePayer && (
              <span title="অতি বাকি রয়েছে" className="text-red-500">⚠️ বিল অগ্রাধিকার</span>
            )}
          </div>
          <p className="text-sm text-ink-soft">{c.phone || ""}</p>
          <p className="mt-1 text-xs text-ink-muted">
            প্রথম অর্ডার: {new Date(orders[orders.length - 1]?.created_at || c.created_at).toLocaleDateString("bn-BD")}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="text-ink-soft">অর্ডার: {orders.length}</p>
          <p className="font-semibold text-brand">{taka(spent)}</p>
          {credits.length > 0 && (
            <p className={`text-xs ${totalDue > 0 ? "text-red-600" : "text-green-600"}`}>বাকি: {taka(totalDue)}</p>
          )}
        </div>
      </div>

      {/* Payment behavior summary */}
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {pendingOrders > 0 && (
          <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-700">অপরিশোধিত অনলাইন ({pendingOrders})</span>
        )}
        {maxOverdue > 0 && (
          <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">বাকি ওভারডু ({maxOverdue} দিন)</span>
        )}
        {paidOrders > 0 && (
          <span className="rounded bg-green-100 px-2 py-0.5 text-green-700">পূর্ণ পেমেন্ট {paidOrders}</span>
        )}
      </div>

      {orders.length > 0 && (
        <div className="mt-3 border-t border-gray-50 pt-2">
          {orders.slice(0, 3).map((o) => (
            <div key={o.id} className="flex justify-between text-sm text-ink-soft">
              <span>{o.order_number} · {o.status} · {o.payment_method}</span>
              <span className={o.payment_status === "paid" ? "text-green-600" : "text-amber-600"}>
                {o.payment_status === "paid" ? "পরিশোধিত" : "বাকি"} · {taka(o.total_bdt)}
              </span>
            </div>
          ))}
        </div>
      )}
      {!orders.length && <p className="mt-2 text-xs text-ink-muted">এখনও কোনো অর্ডার নেই।</p>}

      {/* Record payment action */}
      {totalDue > 0 && (
        <div className="mt-3 border-t border-gray-50 pt-3">
          {!showPay ? (
            <button
              onClick={() => setShowPay(true)}
              className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              পেমেন্ট রেকর্ড করুন
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="পরিমাণ (৳)"
                className="w-32 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
              />
              <button
                disabled={busy}
                onClick={pay}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
              >
                {busy ? "…" : "জমা করুন"}
              </button>
              <button
                onClick={() => { setShowPay(false); setMsg(null); }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-ink-soft"
              >
                বাতিল
              </button>
            </div>
          )}
          {msg && <p className="mt-2 rounded-lg bg-gray-50 p-2 text-sm text-ink-soft">{msg}</p>}
        </div>
      )}
    </div>
  );
}
