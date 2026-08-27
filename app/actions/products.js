// app/actions/products.js — server actions for product CRUD (owner-only via RLS).
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const splitArr = (v) =>
  v ? v.toString().split(",").map((s) => s.trim()).filter(Boolean) : [];

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function upsertProduct(formData) {
  const sb = await createClient();
  const id = formData.get("id") || null;
  const name = (formData.get("name") || "").toString().trim();
  if (!name) return { error: "নাম আবশ্যক" };

  const name_bn = (formData.get("name_bn") || "").toString().trim() || null;
  const brand_id = formData.get("brand_id") || null;
  const model_id = formData.get("model_id") || null;
  const brand = (formData.get("brand") || "").toString().trim() || null; // fallback TEXT
  const brand_en = (formData.get("brand_en") || "").toString().trim() || null; // fallback TEXT
  const category_id = formData.get("category_id") || null;
  const price_bdt = parseInt(formData.get("price_bdt"), 10) || 0;
  const regular_price_bdt = parseInt(formData.get("regular_price_bdt"), 10) || 0;
  const initial_stock = parseInt(formData.get("initial_stock"), 10) || 0;
  const condition = formData.get("condition") || "new_official";
  const official = formData.get("official") === "on" || formData.get("official") === "true";
  const in_stock = formData.get("in_stock") === "on" || formData.get("in_stock") === "true";
  const upcoming = formData.get("upcoming") === "on" || formData.get("upcoming") === "true";
  const colors = splitArr(formData.get("colors"));
  const storages = splitArr(formData.get("storages"));
  const rams = splitArr(formData.get("rams"));
  const image_primary = (formData.get("image_primary") || "").toString().trim() || "/images/products/placeholder.png";
  const image_gallery = splitArr(formData.get("image_gallery"));
  const desc_bn = (formData.get("desc_bn") || "").toString().trim() || null;
  const desc_en = (formData.get("desc_en") || "").toString().trim() || null;
  const badge = (formData.get("badge") || "").toString().trim() || null;
  const tags = splitArr(formData.get("tags"));
  const specs_raw = formData.get("specs");
  let specs = {};
  if (specs_raw) {
    try {
      specs = typeof specs_raw === "string" ? JSON.parse(specs_raw) : specs_raw;
    } catch {
      specs = {};
    }
  }

  // Model detail fields
  const model_full_detail_bn = (formData.get("model_full_detail_bn") || "").toString().trim() || null;
  const model_full_detail_en = (formData.get("model_full_detail_en") || "").toString().trim() || null;
  const launch_year = parseInt(formData.get("launch_year"), 10) || null;

  // Upcoming / supplier tracking fields
  const expected_price_bdt = parseInt(formData.get("expected_price_bdt"), 10) || 0;
  const expected_arrival = formData.get("expected_arrival") || null;
  const supplier_note = (formData.get("supplier_note") || "").toString().trim() || null;

  const payload = {
    name,
    name_bn,
    brand_id,
    model_id,
    brand, // kept for fallback compatibility
    brand_en,
    category_id,
    price_bdt,
    regular_price_bdt,
    condition,
    official,
    in_stock,
    upcoming,
    colors,
    storages,
    rams,
    image_primary,
    image_gallery,
    desc_bn,
    desc_en,
    badge,
    tags,
    specs,
    model_full_detail_bn,
    model_full_detail_en,
    launch_year,
    expected_price_bdt,
    expected_arrival,
    supplier_note,
  };

  let productId = id;
  if (id) {
    const { error } = await sb.from("products").update(payload).eq("id", id);
    if (error) {
      console.error("upsertProduct update failed", error);
      return { error: "আপডেট ব্যর্থ হয়েছে" };
    }
  } else {
    payload.slug = slugify(name);
    const { data, error } = await sb
      .from("products")
      .insert(payload)
      .select("id")
      .single();
    if (error) {
      console.error("upsertProduct insert failed", error);
      return { error: "তৈরি ব্যর্থ (slug সমস্যা হতে পারে)" };
    }
    productId = data.id;
  }

  // Ensure a stock_ledger row exists
  const { data: led } = await sb
    .from("stock_ledger")
    .select("product_id")
    .eq("product_id", productId)
    .maybeSingle();
  if (!led) {
    const { error: iErr } = await sb.from("stock_ledger").insert({
      product_id: productId,
      qty: id ? 0 : initial_stock,
      avg_cost_bdt: 0,
      updated_at: new Date().toISOString(),
    });
    if (iErr) console.error("stock_ledger seed failed", iErr);
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  return { ok: true, id: productId };
}

export async function deleteProduct(id) {
  const sb = await createClient();
  if (!id) return;
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) console.error("deleteProduct failed", error);
  revalidatePath("/admin/products");
  revalidatePath("/admin");
}
