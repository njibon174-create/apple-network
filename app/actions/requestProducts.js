// app/actions/requestProducts.js — server action for requesting a product from supplier.
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function requestProduct(formData) {
  try {
    const sb = await createClient();
    const brand_id = formData.get("brand_id") || null;
    const model_id = formData.get("model_id") || null;
    const expected_price_bdt = parseInt(formData.get("expected_price_bdt"), 10) || 0;
    const expected_arrival = formData.get("expected_arrival") || null;
    const note = (formData.get("note") || "").toString().trim() || null;
  
    if (!brand_id || !model_id) {
      return { error: "ব্র্যান্ড ও মডেল নির্বাচন করুন" };
    }
  
    const { data, error } = await sb
      .from("request_products")
      .insert({
        brand_id,
        model_id,
        expected_price_bdt,
        expected_arrival,
        note,
        status: "requested",
      })
      .select("id")
      .single();
  
    if (error) {
      console.error("requestProduct failed", error);
      return { error: "রিকোয়েস্ট জমা দেওয়া যায়নি" };
    }
  
    revalidatePath("/admin/products");
    revalidatePath("/admin/products/request");
    return { ok: true, id: data.id };
  } catch (error) {
    console.error("Error in requestProducts.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function updateRequestStatus(id, status) {
  try {
    const sb = await createClient();
    if (!id || !status) return;
    const valid = ["requested", "ordered", "arrived", "cancelled"];
    if (!valid.includes(status)) return;
    const { error } = await sb
      .from("request_products")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) console.error("updateRequestStatus failed", error);
    revalidatePath("/admin/products/request");
  } catch (error) {
    console.error("Error in requestProducts.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}
