// app/actions/purchases.js — server action to record a supplier purchase.
// Records the purchase, updates stock_ledger with the weighted-average cost,
// and logs a cash outflow (capital_out). Owner-only via RLS (is_owner()).
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addPurchase({ product_id, supplier, qty, unit_cost_bdt }) {
  try {
    const sb = await createClient();
    const q = parseInt(qty, 10);
    const uc = parseInt(unit_cost_bdt, 10);
    if (!product_id || !q || q <= 0 || !uc || uc <= 0) {
      return { error: "সঠিক তথ্য দিন (পণ্য, পরিমাণ ও দর)" };
    }
  
    const { data: prod } = await sb
      .from("products")
      .select("name")
      .eq("id", product_id)
      .maybeSingle();
    if (!prod) return { error: "পণ্য পাওয়া যায়নি" };
  
    const total = q * uc;
    const sup = (supplier || "").toString().trim();
  
    const { error } = await sb.from("purchases").insert({
      product_id,
      product_name: prod.name,
      supplier: sup,
      qty: q,
      unit_cost_bdt: uc,
      total_cost_bdt: total,
    });
    if (error) {
      console.error("addPurchase insert failed", error);
      return { error: "ক্রয় সংরক্ষণ ব্যর্থ হয়েছে" };
    }
  
    // Weighted-average cost update on stock_ledger.
    const { data: led } = await sb
      .from("stock_ledger")
      .select("qty, avg_cost_bdt")
      .eq("product_id", product_id)
      .maybeSingle();
    const exQty = led?.qty || 0;
    const exAvg = led?.avg_cost_bdt || 0;
    const newQty = exQty + q;
    const newAvg = newQty > 0 ? Math.round((exQty * exAvg + q * uc) / newQty) : uc;
    const { error: uErr } = await sb.from("stock_ledger").upsert(
      {
        product_id,
        qty: newQty,
        avg_cost_bdt: newAvg,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id" }
    );
    if (uErr) console.error("addPurchase stock ledger update failed", uErr);
  
    // Cash outflow mirror.
    const { error: cErr } = await sb.from("cash_transactions").insert({
      type: "capital_out",
      amount_bdt: total,
      ref: sup || null,
      note: `ক্রয়: ${prod.name}`,
    });
    if (cErr) console.error("addPurchase cash mirror failed", cErr);
  
    revalidatePath("/admin/purchases");
    revalidatePath("/admin/cash");
    revalidatePath("/admin/products");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    console.error("Error in purchases.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}
