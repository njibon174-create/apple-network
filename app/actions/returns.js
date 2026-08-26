// app/actions/returns.js — server action to record a product return.
// Inserts into returns; if restock, bumps stock_ledger.qty for the product
// matched by product_name; records the refund as a cash outflow. Owner-only.
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addReturn({ order_number, product_name, reason, refund_bdt, restock }) {
  const sb = await createClient();
  const name = (product_name || "").trim();
  if (!name) return { error: "পণ্যের নাম আবশ্যক" };

  const amt = parseInt(refund_bdt, 10) || 0;
  const doRestock = restock !== false;
  const ordNum = (order_number || "").trim() || null;

  // Resolve order_id from order_number (optional).
  let orderId = null;
  if (ordNum) {
    const { data: o } = await sb
      .from("orders")
      .select("id")
      .eq("order_number", ordNum)
      .maybeSingle();
    orderId = o?.id || null;
  }

  const { error } = await sb.from("returns").insert({
    order_id: orderId,
    order_number: ordNum,
    product_name: name,
    reason: (reason || "").trim() || null,
    refund_bdt: amt,
    restock: doRestock,
  });
  if (error) {
    console.error("addReturn failed", error);
    return { error: "সংরক্ষণ ব্যর্থ হয়েছে" };
  }

  // Restock: increment stock_ledger for the product matched by name.
  if (doRestock) {
    const { data: prod } = await sb
      .from("products")
      .select("id")
      .eq("name", name)
      .maybeSingle();
    if (prod) {
      const { data: led } = await sb
        .from("stock_ledger")
        .select("qty")
        .eq("product_id", prod.id)
        .maybeSingle();
      const cur = led?.qty || 0;
      const { error: uErr } = await sb.from("stock_ledger").upsert(
        { product_id: prod.id, qty: cur + 1, updated_at: new Date().toISOString() },
        { onConflict: "product_id" }
      );
      if (uErr) console.error("addReturn restock failed", uErr);
    }
  }

  // Cash refund outflow (only when a refund amount is given).
  if (amt > 0) {
    const { error: cErr } = await sb.from("cash_transactions").insert({
      type: "refund",
      amount_bdt: amt,
      ref: ordNum,
      note: `রিটার্ন: ${name}`,
    });
    if (cErr) console.error("addReturn cash mirror failed", cErr);
  }

  revalidatePath("/admin/returns");
  revalidatePath("/admin/cash");
  revalidatePath("/admin");
  return { ok: true };
}
