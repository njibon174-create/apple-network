
"use client";
import { useState } from "react";
import QuickSellModal from "./QuickSellModal";
import Icon from "@/components/Icon";

export default function CRMProfileSection({ customer, products }) {
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);

  return (
    <div className="col-span-1 space-y-6">
      {/* profile card */}
      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-ink break-all">
                {customer.name || "—"}
              </h2>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${customer.type === "walk-in" ? "bg-gray-100 text-ink-muted" : customer.type === "credit" ? "bg-amber-100 text-amber-700" : customer.type === "emi" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                {customer.type || "walk-in"}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-soft break-all">{customer.phone || ""}</p>
            {customer.email && (
              <p className="mt-0.5 text-xs text-ink-muted break-all">{customer.email}</p>
            )}
            <p className="mt-2 text-xs text-ink-muted">
              কাস্টমার যাত্রা: {new Date(customer.created_at).toLocaleDateString("bn-BD", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          {customer.note && (
            <div className="rounded-lg max-w-[140px] bg-gray-50 p-2 text-xs text-ink-soft">
              <p className="font-medium text-ink-muted">নোট</p>
              <p className="mt-0.5 break-words">{customer.note}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {customer.phones.length > 1 && (
            <span className="rounded bg-brand/10 px-2 py-0.5 text-brand">
              {customer.phones.length}টি ফোন
            </span>
          )}
          {customer.addresses.length > 0 && (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-ink-muted">
              {customer.addresses.length}টি ঠিকানা
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => setIsSellModalOpen(true)}
          className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-brand-600"
        >
          <Icon name="ShoppingCart" size={16} /> দ্রুত বিক্রয় (Quick Sell)
        </button>
      </div>

      {/* quick stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white border border-gray-100 p-3">
          <p className="text-xs text-ink-muted">মোট অর্ডার</p>
          <p className="text-2xl font-bold text-ink">{customer.orders?.length || 0}</p>
        </div>
        <div className="rounded-xl bg-white border border-gray-100 p-3">
          <p className="text-xs text-ink-muted">মোট খরচ</p>
          <p className="text-2xl font-bold text-brand">
            {new Intl.NumberFormat("bn-BD", { style: "currency", currency: "BDT" }).format(customer.total_spent || 0)}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-gray-100 p-3 col-span-2">
          <p className="text-xs text-ink-muted">বর্তমান বাকি (ক্রেডিট + EMI)</p>
          <p className={`text-2xl font-bold ${(customer.credit_outstanding || 0) > 0 ? "text-red-600" : "text-green-600"}`}>
            {new Intl.NumberFormat("bn-BD", { style: "currency", currency: "BDT" }).format(customer.credit_outstanding || 0)}
          </p>
        </div>
      </div>

      {customer.typeLog.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
            <Icon name="History" size={16} className="text-ink-muted" />
            টাইপ ইতিহাস
          </h3>
          <ol className="space-y-2 text-sm">
            {customer.typeLog.map((tl) => (
              <li key={tl.id} className="flex items-start gap-2">
                <span className={`mt-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${tl.to_type === "credit" ? "bg-amber-100 text-amber-700" : tl.to_type === "emi" ? "bg-blue-100 text-blue-700" : tl.to_type === "online" ? "bg-green-100 text-green-700" : "bg-gray-100 text-ink-muted"}`}>
                  {tl.to_type}
                </span>
                <span className="text-ink-muted">{tl.from_type ? ` ${tl.from_type} থেকে` : ""}</span>
                {tl.reason && <span className="text-ink-soft"> — {tl.reason}</span>}
                <span className="ml-auto text-xs text-ink-muted">{new Date(tl.created_at).toLocaleDateString("bn-BD")}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {isSellModalOpen && (
        <QuickSellModal 
          customer={customer} 
          products={products} 
          onClose={() => setIsSellModalOpen(false)} 
        />
      )}
    </div>
  );
}
