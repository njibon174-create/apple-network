// lib/supabase/queries.js
// Why: reusable server-side queries for Supabase-backed product/category data.
// Drop-in replacements for lib/data.js functions once Supabase is connected.

import { createClient } from "@/lib/supabase/server";

export async function getProductsFromSupabase({ category, condition, limit = 20, offset = 0 } = {}) {
  const supabase = createClient();
  let query = supabase
    .from("v_products_full")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category_slug", category);
  if (condition) query = query.eq("condition", condition);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getProductBySlugFromSupabase(slug) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("v_products_full")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data;
}

export async function getCategoriesFromSupabase() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data || [];
}

export async function getRelatedProductsFromSupabase(categoryId, excludeSlug, limit = 4) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("v_products_full")
    .select("*")
    .eq("category_id", categoryId)
    .neq("slug", excludeSlug)
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function searchProductsFromSupabase(searchTerm, limit = 20) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("v_products_full")
    .select("*")
    .or(`name.ilike.%${searchTerm}%,name_bn.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// Cart helpers (client-side via browser client)
export async function getOrCreateCart(userId, sessionId) {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("carts")
    .select("*")
    .or(`user_id.eq.${userId},session_id.eq.${sessionId}`)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("carts")
    .insert({ user_id: userId, session_id: sessionId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Order lookup for tracking
export async function getOrderByNumber(orderNumber) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("order_number", orderNumber)
    .single();
  if (error) throw error;
  return data;
}