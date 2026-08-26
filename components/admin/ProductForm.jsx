// components/admin/ProductForm.jsx — client form for create/edit product.
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertProduct } from "@/app/actions/products";

const CONDITIONS = [
  { value: "new_official", label: "নতুন (অফিশিয়াল)" },
  { value: "new_unofficial", label: "নতুন (আনঅফিশিয়াল)" },
  { value: "used_excellent", label: "প্রিলাভড — Excellent" },
  { value: "used_good", label: "প্রিলাভড — Good" },
];

const inputCls =
  "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";
const labelCls = "block text-sm font-medium text-ink-soft";

export default function ProductForm({ product = null, categories = [] }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await upsertProduct(fd);
    setSaving(false);
    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/admin/products");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {product?.id && <input type="hidden" name="id" defaultValue={product.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>নাম (ইংরেজি) *</label>
          <input name="name" required defaultValue={product?.name || ""} className={inputCls} placeholder="iPhone 15 Pro" />
        </div>
        <div>
          <label className={labelCls}>নাম (বাংলা)</label>
          <input name="name_bn" defaultValue={product?.name_bn || ""} className={inputCls} placeholder="আইফোন ১৫ প্রো" />
        </div>
        <div>
          <label className={labelCls}>ব্র্যান্ড</label>
          <input name="brand" defaultValue={product?.brand || ""} className={inputCls} placeholder="Apple" />
        </div>
        <div>
          <label className={labelCls}>ক্যাটাগরি</label>
          <select name="category_id" defaultValue={product?.category_id || ""} className={inputCls}>
            <option value="">— নির্বাচন করুন —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_bn || c.name_en || c.slug}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>দাম (৳)</label>
          <input name="price_bdt" type="number" min="0" defaultValue={product?.price_bdt ?? 0} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>রেগুলার দাম (৳)</label>
          <input name="regular_price_bdt" type="number" min="0" defaultValue={product?.regular_price_bdt ?? 0} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>অবস্থা (Condition)</label>
          <select name="condition" defaultValue={product?.condition || "new_official"} className={inputCls}>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>ব্যাজ (Badge)</label>
          <input name="badge" defaultValue={product?.badge || ""} className={inputCls} placeholder="hot / new / sale" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelCls}>কালার (কমা দিন)</label>
          <input name="colors" defaultValue={(product?.colors || []).join(", ")} className={inputCls} placeholder="কালো, সাদা" />
        </div>
        <div>
          <label className={labelCls}>স্টোরেজ (কমা দিন)</label>
          <input name="storages" defaultValue={(product?.storages || []).join(", ")} className={inputCls} placeholder="128GB, 256GB" />
        </div>
        <div>
          <label className={labelCls}>র্যাম (কমা দিন)</label>
          <input name="rams" defaultValue={(product?.rams || []).join(", ")} className={inputCls} placeholder="6GB, 8GB" />
        </div>
      </div>

      <div>
        <label className={labelCls}>ছবির লিংক (Primary Image URL)</label>
        <input name="image_primary" defaultValue={product?.image_primary || ""} className={inputCls} placeholder="/images/products/..." />
      </div>

      <div>
        <label className={labelCls}>বিবরণ (বাংলা)</label>
        <textarea name="desc_bn" rows={3} defaultValue={product?.desc_bn || ""} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>ট্যাগ (কমা দিন)</label>
        <input name="tags" defaultValue={(product?.tags || []).join(", ")} className={inputCls} placeholder="trending, offer" />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" name="official" defaultChecked={!!product?.official} className="h-4 w-4 rounded border-gray-300" />
          অফিশিয়াল
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" name="in_stock" defaultChecked={product ? !!product.in_stock : true} className="h-4 w-4 rounded border-gray-300" />
          স্টকে আছে
        </label>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? "সংরক্ষণ করা হচ্ছে…" : product ? "আপডেট করুন" : "তৈরি করুন"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-ink-soft transition hover:bg-gray-50"
        >
          বাতিল
        </button>
      </div>
    </form>
  );
}
