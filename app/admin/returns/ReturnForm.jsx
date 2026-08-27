// app/admin/returns/ReturnForm.jsx — enhanced form with condition, qty, product_id.
"use client";
import { useState } from "react";
import { createReturn } from "@/app/actions/returns";
import Icon from "@/components/Icon";

const CONDITIONS = [
  { value: "", label: "ঐচ্ছিক" },
  { value: "new", label: "নতুন" },
  { value: "like_new", label: "অত্যন্ত ভালো" },
  { value: "good", label: "ভালো" },
  { value: "damaged", label: "ক্ষতিগ্রস্ত" },
];

export default function ReturnForm() {
  const [orderNumber, setOrderNumber] = useState("");
  const [productName, setProductName] = useState("");
  const [productId, setProductId] = useState("");
  const [reason, setReason] = useState("");
  const [condition, setCondition] = useState("");
  const [qty, setQty] = useState("1");
  const [refund, setRefund] = useState("");
  const [restock, setRestock] = useState(true);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await createReturn({
      order_number: orderNumber,
      product_name: productName,
      product_id: productId,
      reason,
      condition: condition || undefined,
      qty,
      refund_bdt: refund,
      restock,
    });
    setBusy(false);
    if (res?.error) {
      setMsg({ kind: "err", text: res.error });
    } else {
      setMsg({ kind: "ok", text: "রিটার্ন সংরক্ষিত হয়েছে" });
      setOrderNumber("");
      setProductName("");
      setProductId("");
      setReason("");
      setCondition("");
      setQty("1");
      setRefund("");
      setRestock(true);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">অর্ডার নম্বর</label>
        <input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="ঐচ্ছিক"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">পণ্যের নাম</label>
        <input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="পণ্যের নাম"
          required
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">পণ্য আইডি</label>
        <input
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="ঐচ্ছিক (UUID)"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">কন্ডিশন</label>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
        >
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">পরিমাণ</label>
        <input
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">কারণ</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="ঐচ্ছিক"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">রিফান্ড (৳)</label>
        <input
          type="number"
          min="0"
          value={refund}
          onChange={(e) => setRefund(e.target.value)}
          placeholder="0"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600 pb-2">
        <input
          type="checkbox"
          checked={restock}
          onChange={(e) => setRestock(e.target.checked)}
          className="h-4 w-4"
        />
        স্টকে ফেরত
      </label>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-1 bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
      >
        <Icon name="Plus" size={16} /> যোগ করুন
      </button>
      {msg && (
        <span className={`text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}>
          {msg.text}
        </span>
      )}
    </form>
  );
}
