// components/admin/BrandModelSelector.jsx — client component.
// Renders a brand <select>, then a model <select> filtered by brand.
// Pass brand_id / model_id as initial values (for edit forms).
// Fetches brands + models from Supabase on mount.

"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const selectCls =
  "mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export default function BrandModelSelector({
  brand_id = null,
  model_id = null,
  labelBn = "ব্র্যান্ড",
  labelModel = "মডেল",
}) {
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [brandLoading, setBrandLoading] = useState(true);
  const [modelLoading, setModelLoading] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState(brand_id);

  async function loadBrands() {
    try {
      const sb = createClient();
      const { data } = await sb
        .from("brands")
        .select("id, name_bn, name_en")
        .order("sort_order");
      setBrands(data || []);
    } catch (e) {
      console.warn("BrandModelSelector: failed to load brands", e);
      setBrands([]);
    } finally {
      setBrandLoading(false);
    }
  }

  async function loadModels(brandId) {
    setModelLoading(true);
    try {
      const sb = createClient();
      const { data } = await sb
        .from("models")
        .select("id, name_bn, name_en")
        .eq("brand_id", brandId)
        .eq("is_active", true)
        .order("name_bn");
      setModels(data || []);
    } catch (e) {
      console.warn("BrandModelSelector: failed to load models", e);
      setModels([]);
    } finally {
      setModelLoading(false);
    }
  }

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    if (selectedBrandId) {
      loadModels(selectedBrandId);
    } else {
      setModels([]);
    }
  }, [selectedBrandId]);

  function handleBrandChange(e) {
    const v = e.target.value || null;
    setSelectedBrandId(v);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink-soft">{labelBn} *</label>
        {brandLoading ? (
          <select className={selectCls} disabled>
            <option>— লোড হচ্ছে —</option>
          </select>
        ) : (
          <select
            className={selectCls}
            value={selectedBrandId || ""}
            onChange={handleBrandChange}
            name="brand_id"
          >
            <option value="">— নির্বাচন করুন —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name_bn || b.name_en}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-soft">{labelModel}</label>
        {!selectedBrandId ? (
          <select className={selectCls} disabled>
            <option>— প্রথমে ব্র্যান্ড বেছে নিন —</option>
          </select>
        ) : modelLoading ? (
          <select className={selectCls} disabled>
            <option>— লোড হচ্ছে —</option>
          </select>
        ) : (
          <select
            className={selectCls}
            onChange={(e) => {
              const v = e.target.value || "";
              const hidden = e.currentTarget.closest("div").querySelector('input[type="hidden"]');
              if (hidden) hidden.value = v;
            }}
          >
            <option value="">— নির্বাচন করুন —</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name_bn || m.name_en}
              </option>
            ))}
          </select>
        )}
        <input type="hidden" name="model_id" defaultValue={model_id || ""} />
      </div>
    </div>
  );
}
