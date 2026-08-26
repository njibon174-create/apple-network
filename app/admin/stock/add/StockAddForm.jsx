// app/admin/stock/add/StockAddForm.jsx — "Add Stock" flow (owner-only, client).
// Why: the owner's requested add flow is Category -> Brand -> Model Name ->
// Condition (New/Used) -> Official/Unofficial, then price + starting stock.
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertProduct } from "@/app/actions/products";

const inputCls =
  "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";
const labelCls = "block text-sm font-medium text-ink-soft";

export default function StockAddForm({ categories = [], brands = [] }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  // Two-step condition: New/Used (radio) + Official/Unofficial (toggle).
  const [condGroup, setCondGroup] = useState("new"); // 'new' | 'used'
  const [official, setOfficial] = useState(true);

  // Derive the DB condition enum from the two choices.
  function derivedCondition() {
    if (condGroup === "new") return official ? "new_official" : "new_unofficial";
    return official ? "used_excellent" : "used_good"; // used -> excellent if official, good if not
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    // Inject the derived condition + official flag.
    fd.set("condition", derivedCondition());
    fd.set("official", official ? "on" : "off");
    fd.set("in_stock", "on");
    const res = await upsertProduct(fd);
    setSaving(false);
    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/admin/stock");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* 1) Category */}
      <div>
        <label className={labelCls}>ক্যাটাগরি *</label>
        <select name="category_id" required defaultValue="" className={inputCls}>
          <option value="">— নির্বাচন করুন —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_bn || c.name_en || c.slug}
            </option>
          ))}
        </select>
      </div>

      {/* 2) Brand (dropdown of existing + free type via datalist) */}
      <div>
        <label className={labelCls}>ব্র্যান্ড *</label>
        <input
          name="brand"
          required
          list="brand-list"
          className={inputCls}
          placeholder="Apple / Samsung / নতুন ব্র্যান্ড লিখুন"
        />
        <datalist id="brand-list">
          {brands.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
        <p className="mt-1 text-xs text-ink-muted">থাকা ব্র্যান্ড থেকে বাছাই করুন অথবা নতুন ব্র্যান্ড লিখুন।</p>
      </div>

      {/* 3) Model name */}
      <div>
        <label className={labelCls}>মডেল নাম *</label>
        <input
          name="name"
          required
          className={inputCls}
          placeholder="iPhone 15 Pro / Galaxy A24"
        />
      </div>

      {/* 4) Condition: New / Used */}
      <div>
        <label className={labelCls}>অবস্থা (Condition)</label>
        <div className="mt-1 flex gap-2">
          {[
            { k: "new", t: "নতুন (New)" },
            { k: "used", t: "ব্যবহৃত (Used)" },
          ].map((o) => (
            <button
              type="button"
              key={o.k}
              onClick={() => setCondGroup(o.k)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                condGroup === o.k
                  ? "border-brand bg-brand-light text-brand-700"
                  : "border-gray-200 text-ink-soft hover:bg-gray-50"
              }`}
            >
              {o.t}
            </button>
          ))}
        </div>
      </div>

      {/* 5) Official / Unofficial */}
      <div>
        <label className={labelCls}>অফিশিয়াল / আনঅফিশিয়াল</label>
        <div className="mt-1 flex gap-2">
          {[
            { v: true, t: "অফিশিয়াল (Official)" },
            { v: false, t: "আনঅফিশিয়াল (Unofficial)" },
          ].map((o) => (
            <button
              type="button"
              key={String(o.v)}
              onClick={() => setOfficial(o.v)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                official === o.v
                  ? "border-brand bg-brand-light text-brand-700"
                  : "border-gray-200 text-ink-soft hover:bg-gray-50"
              }`}
            >
              {o.t}
            </button>
          ))}
        </div>
      </div>

      {/* Price + initial stock */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>দাম (৳) *</label>
          <input name="price_bdt" type="number" min="0" required className={inputCls} placeholder="22900" />
        </div>
        <div>
          <label className={labelCls}>প্রাথমিক স্টক (যোগ করা পরিমাণ)</label>
          <input name="initial_stock" type="number" min="0" defaultValue="1" className={inputCls} />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? "সংরক্ষণ করা হচ্ছে…" : "স্টক যোগ করুন"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/stock")}
          className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-ink-soft transition hover:bg-gray-50"
        >
          বাতিল
        </button>
      </div>
    </form>
  );
}
