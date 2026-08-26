"use client";

import { useState } from "react";
import { addCashTxn } from "@/app/actions/cash";
import Icon from "@/components/Icon";

export default function CashForm() {
  const [type, setType] = useState("capital_in");
  const [amount, setAmount] = useState("");
  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await addCashTxn({ type, amount_bdt: amount, ref, note });
    setBusy(false);
    if (res?.error) {
      setMsg({ kind: "err", text: res.error });
    } else {
      setMsg({ kind: "ok", text: "সংরক্ষিত হয়েছে" });
      setAmount("");
      setRef("");
      setNote("");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">ধরন</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
        >
          <option value="capital_in">মূলধন প্রবেশ</option>
          <option value="capital_out">মূলধন বাহির</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">পরিমাণ (৳)</label>
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          required
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">রেফারেন্স</label>
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="ঐচ্ছিক"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">নোট</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ঐচ্ছিক"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>
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
