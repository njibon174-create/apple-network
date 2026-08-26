"use client";

import { useState } from "react";
import { addExpense, deleteExpense } from "@/app/actions/expenses";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";

const CATEGORIES = [
  { value: "rent", label: "বাড়ি ভাড়া" },
  { value: "salary", label: "বেতন" },
  { value: "utility", label: "ইউটিলিটি" },
  { value: "transport", label: "পরিবহন" },
  { value: "misc", label: "বিবিধ" },
  { value: "other", label: "অন্যান্য" },
];

export default function ExpenseForm() {
  const [category, setCategory] = useState("rent");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await addExpense({ category, amount_bdt: amount, note });
    setBusy(false);
    if (res?.error) {
      setMsg({ kind: "err", text: res.error });
    } else {
      setMsg({ kind: "ok", text: "সংরক্ষিত হয়েছে" });
      setAmount("");
      setNote("");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">ক্যাটাগরি</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
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

export function ExpenseRow({ row }) {
  const label = CATEGORIES.find((c) => c.value === row.category)?.label || row.category;
  return (
    <tr className="border-b border-gray-50">
      <td className="py-2 pr-4 text-gray-600">
        {new Date(row.created_at).toLocaleString("bn-BD")}
      </td>
      <td className="py-2 pr-4">{label}</td>
      <td className="py-2 pr-4 text-gray-600">{row.note || "—"}</td>
      <td className="py-2 pr-4 text-right font-medium text-red-600">{taka(row.amount_bdt)}</td>
      <td className="py-2 text-right">
        <button
          onClick={() => deleteExpense(row.id)}
          className="text-gray-400 hover:text-red-600"
          title="মুছুন"
        >
          <Icon name="Trash2" size={16} />
        </button>
      </td>
    </tr>
  );
}
