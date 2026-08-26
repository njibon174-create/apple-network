// lib/orders-admin.js — owner-context read of all orders for the admin panel.
import { createClient } from "@/lib/supabase/server";

const SELECT = [
  "order_number",
  "status",
  "source",
  "total_bdt",
  "subtotal_bdt",
  "payment_method",
  "payment_status",
  "shipping_name",
  "shipping_phone",
  "shipping_address",
  "shipping_city",
  "shipping_division",
  "shipping_email",
  "customer_id",
  "created_at",
  "order_items(product_name,color,storage,ram,condition,qty,unit_price_bdt,product_image)",
  "order_status_log(from_status,to_status,note,created_at)",
].join(",");

// src: "all" | "online" | "pos"
export async function sbAdminOrders(src = "all") {
  try {
    const sb = await createClient();
    let q = sb.from("orders").select(SELECT).order("created_at", { ascending: false });
    if (src === "online") q = q.eq("source", "online");
    if (src === "pos") q = q.eq("source", "pos");
    const { data, error } = await q;
    if (error) {
      console.error("sbAdminOrders failed", error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("sbAdminOrders threw", e);
    return [];
  }
}
