// components/admin/PurchaseForm.jsx — client form to record a supplier purchase.
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addPurchase } from "@/app/actions/purchases";

const inputCls =
  "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";
const labelCls = "block text-sm font-medium text-ink-soft";

export default function PurchaseForm({ products = [] }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await addPurchase({
      product_id: fd.get("product_id"),
      supplier: fd.get("supplier"),
      qty: fd.get("qty"),
      unit_cost_bdt: fd.get("unit_cost_bdt"),
    });
    setSaving(false);
    if (res?.error) {
      setError(res.error);
    } else {
      setMsg("ক্রয় সংরক্ষিত হয়েছে।");
      e.currentTarget.reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className={labelCls}>পণ্য *</label>
        <select name="product_id" required className={inputCls} defaultValue="">
          <option value="">— পণ্য নির্বাচন করুন —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>সাপ্লায়ার / বিক্রেতা</label>
        <input name="supplier" className={inputCls} placeholder="সাপ্লায়ারের নাম" />
      </div>
      <div>
        <label className={labelCls}>পরিমাণ *</label>
        <input name="qty" type="number" min="1" required className={inputCls} placeholder="10" />
      </div>
      <div>
        <label className={labelCls}>একক দাম (৳) *</label>
        <input name="unit_cost_bdt" type="number" min="1" required className={inputCls} placeholder="5000" />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 sm:col-span-2">{error}</p>
      )}
      {msg && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700 sm:col-span-2">{msg}</p>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? "সংরক্ষণ করা হচ্ছে…" : "ক্রয় সংরক্ষণ করুন"}
        </button>
      </div>
    </form>
  );
}
