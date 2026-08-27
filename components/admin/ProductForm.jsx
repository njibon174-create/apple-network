// components/admin/ProductForm.jsx — client form for create/edit product (with brand→model).
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { upsertProduct } from "@/app/actions/products";
import BrandModelSelector from "@/components/admin/BrandModelSelector";

const CONDITIONS = [
  { value: "new_official", label: "নতুন (অফিশিয়াল)" },
  { value: "new_unofficial", label: "নতুন (আনঅফিশিয়াল)" },
  { value: "used_excellent", label: "প্রিলাভড — Excellent" },
  { value: "used_good", label: "প্রিলাভড — Good" },
];

const inputCls =
  "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";
const labelCls = "block text-sm font-medium text-ink-soft";
const textareaCls = inputCls + " resize-y";

export default function ProductForm({ product = null, categories = [] }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [specs, setSpecs] = useState(
    product?.specs ? JSON.stringify(product.specs, null, 2) : ""
  );

  // Sync the hidden model_id input when BrandModelSelector changes it
  useEffect(() => {
    // The hidden input is managed by the selector; nothing extra to do here.
  }, [product]);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    // Parse specs from textarea
    let parsedSpecs = {};
    const rawSpecs = fd.get("specs_json");
    if (rawSpecs && typeof rawSpecs === "string") {
      try {
        parsedSpecs = JSON.parse(rawSpecs);
      } catch {
        setError("স্পেক JSON ভুল হয়েছে");
        setSaving(false);
        return;
      }
    }
    fd.set("specs", JSON.stringify(parsedSpecs));

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

      {/* Brand → Model selector */}
      <div className="grid gap-4 sm:grid-cols-2">
        <BrandModelSelector
          brand_id={product?.brand_id || null}
          model_id={product?.model_id || null}
        />
      </div>

      {/* Brand/Model display fields (hidden — used when no FK selected) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>ব্র্যান্ড (ফলব্যাক TEXT)</label>
          <input
            name="brand"
            defaultValue={product?.brand || ""}
            className={inputCls}
            placeholder="Apple"
          />
        </div>
        <div>
          <label className={labelCls}>মডেল (ফলব্যাক TEXT)</label>
          <input
            name="brand_en"
            defaultValue={product?.brand_en || ""}
            className={inputCls}
            placeholder="iPhone 15"
          />
        </div>
      </div>

      {/* Model detail fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>লঞ্চ ইয়ার</label>
          <input
            name="launch_year"
            type="number"
            min="1990"
            max={new Date().getFullYear() + 1}
            defaultValue={product?.launch_year || ""}
            className={inputCls}
            placeholder="২০২৪"
          />
        </div>
        <div>
          <label className={labelCls}>মডেলের সম্পূর্ণ বিবরণ (বাংলা)</label>
          <textarea
            name="model_full_detail_bn"
            rows={2}
            defaultValue={product?.model_full_detail_bn || ""}
            className={textareaCls}
            placeholder="ডিসপ্লে, প্রসেসর, ক্যামেরা — সংক্ষিপ্ত"
          />
        </div>
        <div>
          <label className={labelCls}>মডেলের সম্পূর্ণ বিবরণ (ইংরেজি)</label>
          <textarea
            name="model_full_detail_en"
            rows={2}
            defaultValue={product?.model_full_detail_en || ""}
            className={textareaCls}
            placeholder="Display, processor, camera — short summary"
          />
        </div>
      </div>

      {/* Core product fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>নাম (ইংরেজি) *</label>
          <input
            name="name"
            required
            defaultValue={product?.name || ""}
            className={inputCls}
            placeholder="iPhone 15 Pro"
          />
        </div>
        <div>
          <label className={labelCls}>নাম (বাংলা)</label>
          <input
            name="name_bn"
            defaultValue={product?.name_bn || ""}
            className={inputCls}
            placeholder="আইফোন ১৫ প্রো"
          />
        </div>
        <div>
          <label className={labelCls}>ক্যাটাগরি</label>
          <select
            name="category_id"
            defaultValue={product?.category_id || ""}
            className={inputCls}
          >
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
          <input
            name="price_bdt"
            type="number"
            min="0"
            defaultValue={product?.price_bdt ?? 0}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>রেগুলার দাম (৳)</label>
          <input
            name="regular_price_bdt"
            type="number"
            min="0"
            defaultValue={product?.regular_price_bdt ?? 0}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>অবস্থা (Condition)</label>
          <select
            name="condition"
            defaultValue={product?.condition || "new_official"}
            className={inputCls}
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Badge */}
      <div>
        <label className={labelCls}>ব্যাজ (Badge)</label>
        <input
          name="badge"
          defaultValue={product?.badge || ""}
          className={inputCls}
          placeholder="hot / new / sale"
        />
      </div>

      {/* Array fields */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelCls}>কালার (কমা দিন)</label>
          <input
            name="colors"
            defaultValue={(product?.colors || []).join(", ")}
            className={inputCls}
            placeholder="কালো, সাদা"
          />
        </div>
        <div>
          <label className={labelCls}>স্টোরেজ (কমা দিন)</label>
          <input
            name="storages"
            defaultValue={(product?.storages || []).join(", ")}
            className={inputCls}
            placeholder="128GB, 256GB"
          />
        </div>
        <div>
          <label className={labelCls}>র্যাম (কমা দিন)</label>
          <input
            name="rams"
            defaultValue={(product?.rams || []).join(", ")}
            className={inputCls}
            placeholder="6GB, 8GB"
          />
        </div>
      </div>

      {/* Images */}
      <div>
        <label className={labelCls}>মূল ছবির লিংক (Primary Image URL)</label>
        <input
          name="image_primary"
          defaultValue={product?.image_primary || ""}
          className={inputCls}
          placeholder="/images/products/..."
        />
      </div>
      <div>
        <label className={labelCls}>গ্যালারি ছবি (কমা দিয়ে আলাদা করুন)</label>
        <input
          name="image_gallery"
          defaultValue={(product?.image_gallery || []).join(", ")}
          className={inputCls}
          placeholder="/images/products/extra1.jpg, /images/products/extra2.jpg"
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>বিবরণ (বাংলা)</label>
        <textarea
          name="desc_bn"
          rows={3}
          defaultValue={product?.desc_bn || ""}
          className={textareaCls}
        />
      </div>
      <div>
        <label className={labelCls}>বিবরণ (ইংরেজি)</label>
        <textarea
          name="desc_en"
          rows={3}
          defaultValue={product?.desc_en || ""}
          className={textareaCls}
        />
      </div>

      {/* Specs JSON */}
      <div>
        <label className={labelCls}>স্পেক (JSON) — key:value</label>
        <textarea
          name="specs_json"
          rows={5}
          value={specs}
          onChange={(e) => setSpecs(e.target.value)}
          className={textareaCls}
          placeholder={'{"Display":"6.1" Super Retina XDR","Processor":"A16 Bionic"}'}
        />
        <p className="mt-1 text-xs text-ink-muted">
          প্রতিটি লাইন একটি key:value জোড়া। উদা:{" "}
          <code>{"{"}&quot;Display&quot;:&quot;6.1&quot; Super Retina XDR&quot;{"}"}</code>
        </p>
      </div>

      {/* Tags */}
      <div>
        <label className={labelCls}>ট্যাগ (কমা দিন)</label>
        <input
          name="tags"
          defaultValue={(product?.tags || []).join(", ")}
          className={inputCls}
          placeholder="trending, offer"
        />
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="official"
            defaultChecked={!!product?.official}
            className="h-4 w-4 rounded border-gray-300"
          />
          অফিশিয়াল
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="in_stock"
            defaultChecked={product ? !!product.in_stock : true}
            className="h-4 w-4 rounded border-gray-300"
          />
          স্টকে আছে
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="upcoming"
            defaultChecked={!!product?.upcoming}
            className="h-4 w-4 rounded border-gray-300"
          />
          আগামী প্রোডাক্ট (আগে থেকে রিকোয়েস্ট করা, এখনো স্টকে নেই)
        </label>
      </div>

      {/* Supplier tracking (only meaningful when upcoming is checked) */}
      {product?.upcoming || true ? (
        <div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-ink-soft">সরবরাহকারী ট্র্যাকিং (শুধু upcoming প্রোডাক্টের জন্য)</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>প্রত্যাশিত দাম (৳)</label>
                <input
                  name="expected_price_bdt"
                  type="number"
                  min="0"
                  defaultValue={product?.expected_price_bdt ?? 0}
                  className={inputCls}
                  placeholder="৳"
                />
              </div>
              <div>
                <label className={labelCls}>প্রত্যাশিত আগমনের তারিখ</label>
                <input
                  name="expected_arrival"
                  type="date"
                  defaultValue={
                    product?.expected_arrival
                      ? product.expected_arrival.slice(0, 10)
                      : ""
                  }
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>নোট / সরবরাহকারীর নাম</label>
                <textarea
                  name="supplier_note"
                  rows={2}
                  defaultValue={product?.supplier_note || ""}
                  className={textareaCls}
                  placeholder="সরবরাহকারীর নাম, অর্ডার নম্বর, বিশেষ শর্ত ইত্যাদি"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
