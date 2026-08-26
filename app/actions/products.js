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
  const brand = (formData.get("brand") || "").toString().trim() || null;
  const category_id = formData.get("category_id") || null;
  const price_bdt = parseInt(formData.get("price_bdt"), 10) || 0;
  const regular_price_bdt = parseInt(formData.get("regular_price_bdt"), 10) || 0;
  const initial_stock = parseInt(formData.get("initial_stock"), 10) || 0;
  const condition = formData.get("condition") || "new_official";
  const official = formData.get("official") === "on" || formData.get("official") === "true";
  const in_stock = formData.get("in_stock") === "on" || formData.get("in_stock") === "true";
  const colors = splitArr(formData.get("colors"));
  const storages = splitArr(formData.get("storages"));
  const rams = splitArr(formData.get("rams"));
  const image_primary = (formData.get("image_primary") || "").toString().trim() || "/images/products/placeholder.png";
  const desc_bn = (formData.get("desc_bn") || "").toString().trim() || null;
  const badge = (formData.get("badge") || "").toString().trim() || null;
  const tags = splitArr(formData.get("tags"));

  const payload = {
    name,
    name_bn,
    brand,
    category_id,
    price_bdt,
    regular_price_bdt,
    condition,
    official,
    in_stock,
    colors,
    storages,
    rams,
    image_primary,
    desc_bn,
    badge,
    tags,
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

  // Ensure a stock_ledger row exists (insert with initial_stock on create).
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
  return { ok: true };
}

export async function deleteProduct(id) {
  const sb = await createClient();
  if (!id) return;
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) console.error("deleteProduct failed", error);
  revalidatePath("/admin/products");
  revalidatePath("/admin");
}
