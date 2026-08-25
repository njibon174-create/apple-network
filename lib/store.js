// lib/store.js
// Why: Supabase-backed data layer with normalized product shape + sample-data fallback.
// Pages call these async functions; if Supabase is unreachable (e.g. env not set,
// local dev without keys, or Vercel build-time preview), it silently falls back to
// lib/data.js so the site never breaks.

import {
  PRODUCTS, CATEGORIES, getProduct as getSampleProduct,
  byCategory as byCategorySample, featured as featuredSample, phones as phonesSample,
} from "@/lib/data";

// Map Supabase condition enum -> { official: boolean, conditionKey: string }
function mapCondition(cond) {
  switch (cond) {
    case "new_official": return { official: true, condition: "new-official" };
    case "new_unofficial": return { official: false, condition: "new-unofficial" };
    case "used_excellent": return { official: false, condition: "used-excellent" };
    case "used_good": return { official: false, condition: "used-good" };
    default: return { official: true, condition: "new-official" };
  }
}

// Normalize a Supabase v_products_full row into the shape ProductCard / pages expect.
function normalize(row) {
  const { official, condition } = mapCondition(row.condition);
  const storage = Array.isArray(row.storages) && row.storages.length ? row.storages[0] : undefined;
  const ram = Array.isArray(row.rams) && row.rams.length ? row.rams[0] : undefined;
  return {
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category_slug,
    condition,
    official,
    price: row.price_bdt,
    regularPrice: row.regular_price_bdt ?? null,
    storage,
    ram,
    badge: row.badge ?? null,
    emiFrom: row.emi_from_bdt ?? null,
    inStock: row.in_stock,
    rating: row.rating ?? 0,
    reviews: row.review_count ?? 0,
    image: row.image_primary,
    specs: row.specs ?? {},
    desc: row.desc_bn ?? "",
  };
}

// Lazily build a server client (avoids import errors during build if keys missing).
function getSupabase() {
  const url = process.env.NEXT_SUPABASE_URL;
  const key = process.env.NEXT_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  // Read-only anon queries from server components — plain supabase-js is simplest
  // and avoids cookie/session handling needed by auth-helpers.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---- Public async loaders ----

export async function getProducts({ category, condition, limit = 60, offset = 0 } = {}) {
  const sb = getSupabase();
  if (!sb) return PRODUCTS;
  try {
    let query = sb
      .from("v_products_full")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (category) query = query.eq("category_slug", category);
    if (condition) query = query.eq("condition", condition);
    const { data, error } = await query;
    if (error || !data) return PRODUCTS;
    return data.map(normalize);
  } catch {
    return PRODUCTS;
  }
}

export async function getProduct(slug) {
  const sb = getSupabase();
  if (!sb) return getSampleProduct(slug);
  try {
    const { data, error } = await sb
      .from("v_products_full")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error || !data) return getSampleProduct(slug);
    return normalize(data);
  } catch {
    return getSampleProduct(slug);
  }
}

export async function getCategories() {
  const sb = getSupabase();
  if (!sb) return CATEGORIES;
  try {
    const { data, error } = await sb
      .from("categories")
      .select("slug, name_bn, name_en, icon_name, description_bn, sort_order")
      .order("sort_order");
    if (error || !data) return CATEGORIES;
    return data.map((c) => ({
      slug: c.slug,
      name: c.name_bn,
      en: c.name_en,
      icon: c.icon_name || "Boxes",
      desc: c.description_bn || "",
    }));
  } catch {
    return CATEGORIES;
  }
}

export async function getByCategory(cat) {
  const all = await getProducts({ category: cat });
  return all;
}

export async function getFeatured() {
  const all = await getProducts({ limit: 20 });
  return all.filter((p) => p.badge).slice(0, 8);
}

export async function getPhones() {
  return getByCategory("phones");
}

export async function searchProducts(term) {
  const all = await getProducts({ limit: 100 });
  const t = (term || "").trim().toLowerCase();
  if (!t) return all;
  return all.filter((p) =>
    [p.name, p.brand, p.category].join(" ").toLowerCase().includes(t)
  );
}
