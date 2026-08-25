// app/actions/orders.js — server action to update order status
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateOrderStatus(orderNumber, status) {
  const sb = await createClient();
  const { error } = await sb
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("order_number", orderNumber);
  if (error) console.error("updateOrderStatus failed", error);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
