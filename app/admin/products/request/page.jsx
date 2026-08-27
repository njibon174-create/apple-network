// app/admin/products/request/page.jsx — request a product from supplier.
// Fixed: uses request_products table.
"use client";
import { createClient } from "@supabase/supabase-js";
import { requestProduct, updateRequestStatus } from "@/app/actions/requestProducts";
import Icon from "@/components/Icon";
import { useState } from "react";
import { useRouter } from "next/navigation";

function sbBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export const dynamic = "force-dynamic";

const STATUS_LABEL = {
  requested: "রিকোয়েস্ট করা হয়েছে",
  ordered: "অর্ডার করা হয়েছে",
  arrived: "পৌঁছেছে",
  cancelled: "বাতিল",
};

export default function RequestProducts() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">রিকোয়েস্ট প্রোডাক্ট</h1>
          <p className="mt-1 text-sm text-ink-muted">সরবরাহকারীর কাছে প্রোডাক্ট রিকোয়েস্ট</p>
        </div>
        <a
          href="/admin/products"
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-gray-50"
        >
          <Icon name="ArrowLeft" size={16} /> প্রোডাক্ট তালিকায় ফিরে যান
        </a>
      </div>

      <RequestFormSection />

      <RequestHistorySection />
    </div>
  );
}

function RequestFormSection() {
  const router = useRouter();
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [modelLoading, setModelLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function loadBrands() {
    try {
      const sb = sbBrowser();
      const { data } = await sb
        .from("brands")
        .select("id, name_bn, name_en")
        .order("sort_order");
      setBrands(data || []);
    } catch {
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadModels(brandId) {
    setModelLoading(true);
    try {
      const sb = sbBrowser();
      const { data } = await sb
        .from("models")
        .select("id, name_bn, name_en")
        .eq("brand_id", brandId)
        .eq("is_active", true)
        .order("name_bn");
      setModels(data || []);
    } catch {
      setModels([]);
    } finally {
      setModelLoading(false);
    }
  }

  function handleBrandChange(e) {
    const v = e.target.value;
    setSelectedBrandId(v);
    setSelectedModelId("");
    if (v) loadModels(v);
    else setModels([]);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await requestProduct(e.currentTarget);
    setSaving(false);
    if (res?.error) {
      setError(res.error);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6">
      <h2 className="text-lg font-semibold text-ink">নতুন রিকোয়েস্ট</h2>
      <p className="mt-1 text-sm text-ink-muted">সরবরাহকারীর কাছে একটি প্রোডাক্ট রিকোয়েস্ট করুন</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-ink-soft">ব্র্যান্ড *</label>
            {loading ? (
              <select className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" disabled>
                <option>— লোড হচ্ছে —</option>
              </select>
            ) : (
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
                value={selectedBrandId}
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
            <label className="block text-sm font-medium text-ink-soft">মডেল *</label>
            {!selectedBrandId ? (
              <select className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" disabled>
                <option>— প্রথমে ব্র্যান্ড বেছে নিন —</option>
              </select>
            ) : modelLoading ? (
              <select className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" disabled>
                <option>— লোড হচ্ছে —</option>
              </select>
            ) : (
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                name="model_id"
              >
                <option value="">— নির্বাচন করুন —</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name_bn || m.name_en}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-soft">প্রত্যাশিত দাম (৳) *</label>
            <input
              type="number"
              name="expected_price_bdt"
              min="0"
              required
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="৳"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-soft">প্রত্যাশিত আগমনের তারিখ</label>
            <input
              type="date"
              name="expected_arrival"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink-soft">নোট</label>
            <textarea
              name="note"
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand resize-y"
              placeholder="সরবরাহকারীর নাম, অর্ডার নম্বর, বিশেষ শর্ত ইত্যাদি"
            />
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || !selectedBrandId || !selectedModelId}
            className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            {saving ? "জমা দেওয়া হচ্ছে…" : "রিকোয়েস্ট জমা দিন"}
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
    </div>
  );
}

function RequestHistorySection() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  async function loadRequests() {
    try {
      const sb = sbBrowser();
      let query = sb
        .from("request_products")
        .select("id, brand_id, model_id, brand_name, model_name, expected_price_bdt, expected_arrival, note, status, created_at")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data } = await query;
      setRequests(data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id, status) {
    const res = await updateRequestStatus(id, status);
    if (res?.ok) {
      loadRequests();
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6">
      <h2 className="text-lg font-semibold text-ink">রিকোয়েস্টের ইতিহাস</h2>

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {["all", "requested", "ordered", "arrived", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); loadRequests(); }}
            className={`rounded-full px-3 py-1 transition ${filter === s ? "bg-brand text-white" : "bg-gray-100 text-ink-soft hover:bg-gray-200"}`}
          >
            {s === "all" ? "সব" : STATUS_LABEL[s] || s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-ink-muted">লোড হচ্ছে…</p>
      ) : requests.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">কোনো রিকোয়েস্ট নেই।</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {requests.map((r) => (
            <li key={r.id} className="rounded-lg bg-gray-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">
                    {r.brand_name} {r.model_name}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    প্রত্যাশিত দাম: ৳{r.expected_price_bdt?.toLocaleString("bn-BD")}
                  </p>
                  {r.expected_arrival && (
                    <p className="text-xs text-ink-muted">
                      প্রত্যাশিত আগমন: {new Date(r.expected_arrival).toLocaleDateString("bn-BD")}
                    </p>
                  )}
                  {r.note && <p className="mt-1 text-xs text-ink-soft line-clamp-2">{r.note}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "requested" ? "bg-amber-100 text-amber-700" : r.status === "ordered" ? "bg-blue-100 text-blue-700" : r.status === "arrived" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {STATUS_LABEL[r.status] || r.status}
                  </span>
                  {r.status !== "arrived" && r.status !== "cancelled" && (
                    <>
                      <button onClick={() => handleStatusChange(r.id, "ordered")} className="text-xs text-blue-600 hover:underline">অর্ডার করুন</button>
                      <span className="text-xs text-ink-muted">|</span>
                      <button onClick={() => handleStatusChange(r.id, "cancelled")} className="text-xs text-red-500 hover:underline">বাতিল</button>
                    </>
                  )}
                  {r.status === "ordered" && (
                    <button onClick={() => handleStatusChange(r.id, "arrived")} className="text-xs text-green-600 hover:underline">পৌঁছেছে</button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
