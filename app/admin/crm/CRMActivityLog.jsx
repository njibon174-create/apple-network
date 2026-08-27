// app/admin/crm/CRMActivityLog.jsx — activity log with kind filter (client).
"use client";
import { useState } from "react";

const KIND_LABELS = {
  customer_created: "কাস্টমার তৈরি",
  customer_updated: "প্রোফাইল আপডেট",
  type_changed: "টাইপ পরিবর্তন",
  address_added: "ঠিকানা যোগ",
  address_updated: "ঠিকানা আপডেট",
  address_removed: "ঠিকানা মুছে ফেলা",
  phone_added: "ফোন যোগ",
  phone_removed: "ফোন মুছে ফেলা",
  phone_set_primary: "প্রাথমিক ফোন",
  order_placed: "অর্ডার দেওয়া হয়েছে",
  payment_received: "পেমেন্ট প্রাপ্ত",
  credit_memo: "ক্রেডিট মেমো",
  emi_created: "ইমি তৈরি",
  note_updated: "নোট পরিবর্তন",
};

const KIND_COLOR = {
  customer_created: "bg-green-100 text-green-700",
  customer_updated: "bg-blue-100 text-blue-700",
  type_changed: "bg-purple-100 text-purple-700",
  address_added: "bg-amber-100 text-amber-700",
  address_updated: "bg-amber-100 text-amber-700",
  address_removed: "bg-red-100 text-red-700",
  phone_added: "bg-rose-100 text-rose-700",
  phone_removed: "bg-red-100 text-red-700",
  phone_set_primary: "bg-indigo-100 text-indigo-700",
  order_placed: "bg-sky-100 text-sky-700",
  payment_received: "bg-green-100 text-green-700",
  credit_memo: "bg-orange-100 text-orange-700",
  emi_created: "bg-cyan-100 text-cyan-700",
  note_updated: "bg-gray-100 text-ink-muted",
};

export default function CRMActivityLog({ activities, customer }) {
  const [filter, setFilter] = useState("all");

  const all = activities || [];
  const filtered =
    filter === "all"
      ? all
      : all.filter((a) => a.kind === filter);

  const kinds = ["all", ...new Set(all.map((a) => a.kind))].sort((a, b) => {
    if (a === "all") return -1;
    if (b === "all") return 1;
    return 0; // keep insertion order-ish
  });

  if (!all.length) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <h3 className="flex items-center gap-2 text-lg font-medium text-ink">
          <svg className="h-5 w-5 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          কার্যক্রমের ইতিহাস
        </h3>
        <div className="mt-3 rounded-lg bg-gray-50 p-4 text-center text-sm text-ink-muted">
          এখনও কোনো কার্যক্রম লগ করা হয়নি।
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex items-center gap-2">
        <h3 className="flex items-center gap-2 text-lg font-medium text-ink">
          <svg className="h-5 w-5 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          কার্যক্রমের ইতিহাস
        </h3>
        <span className="ml-auto text-xs text-ink-muted">
          {all.length}টি লগ ({filtered.length}টি দেখাচ্ছে)
        </span>
      </div>

      {/* filter pills */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {kinds.map((k) => {
          const label = k === "all" ? "সব" : (KIND_LABELS[k] || k);
          const color = k === "all" ? "bg-gray-100 text-ink-muted" : (KIND_COLOR[k] || "bg-gray-100 text-ink-muted");
          const count = k === "all" ? all.length : all.filter((a) => a.kind === k).length;
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                filter === k ? "bg-brand text-white" : `bg-white border border-gray-200 text-ink-soft hover:bg-gray-50`
              }`}
            >
              {label}
              <span className="ml-1 text-ink-muted">({count})</span>
            </button>
          );
        })}
      </div>

      {/* log entries */}
      <ul className="mt-3 space-y-1.5">
        {filtered.map((a, idx) => (
          <li
            key={a.id || idx}
            className="rounded-lg bg-gray-50 px-3 py-2 text-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${KIND_COLOR[a.kind] || KIND_COLOR["note_updated"]}`}>
                    {KIND_LABELS[a.kind] || a.kind}
                  </span>
                  <span className="text-ink">{a.summary}</span>
                </div>
                {a.detail && Object.keys(a.detail).length > 0 && (
                  <pre className="mt-1 overflow-x-auto text-xs text-ink-muted bg-white rounded px-2 py-1">
                    {JSON.stringify(a.detail, null, 1)}
                  </pre>
                )}
              </div>
              <span className="text-xs text-ink-muted flex-shrink-0">
                {new Date(a.created_at).toLocaleString("bn-BD", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
