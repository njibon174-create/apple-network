// app/actions/orders.js — server actions for order lifecycle (owner-only).
// Every export is wrapped in try/catch so a failure returns a structured error
// instead of throwing a white-screen "server-side exception".
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PIPELINE = ["new", "confirmed", "preparing", "shipping", "delivered"];

// Advance an order to the next step, recording a note in order_status_log.
// nextStatus is one of confirmed|preparing|shipping|delivered.
export async function updateOrderStatus(orderNumber, nextStatus, note) {
  try {
    if (!nextStatus) return { error: "স্ট্যাটাস দিন" };
    const sb = await createClient();
    const { data: cur } = await sb
      .from("orders")
      .select("id, status")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (!cur) return { error: "অর্ডার পাওয়া যায়নি" };
    if (cur.status === nextStatus) return { ok: true };

    const { error } = await sb
      .from("orders")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("order_number", orderNumber);
    if (error) return { error: "স্ট্যাটাস আপডেট ব্যর্থ" };

    await sb
      .from("order_status_log")
      .insert({
        order_id: cur.id,
        from_status: cur.status,
        to_status: nextStatus,
        note: note || null,
      })
      .then(() => {})
      .catch((e) => console.error("status_log insert skipped:", e));

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    revalidatePath("/track");
    return { ok: true };
  } catch (e) {
    console.error("updateOrderStatus threw", e);
    return { error: "সার্ভার এরর — পেজ রিফ্রেশ করে আবার চেষ্টা করুন" };
  }
}

// Cancel an order (only from Pending). Records a note.
export async function cancelOrder(orderNumber, note) {
  try {
    const sb = await createClient();
    const { data: cur } = await sb
      .from("orders")
      .select("id, status")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (!cur) return { error: "অর্ডার পাওয়া যায়নি" };

    const { error } = await sb
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("order_number", orderNumber);
    if (error) return { error: "বাতিল করা যায়নি" };

    await sb
      .from("order_status_log")
      .insert({
        order_id: cur.id,
        from_status: cur.status,
        to_status: "cancelled",
        note: note || "মালিক বাতিল করেছেন",
      })
      .then(() => {})
      .catch((e) => console.error("status_log insert skipped:", e));

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    revalidatePath("/track");
    return { ok: true };
  } catch (e) {
    console.error("cancelOrder threw", e);
    return { error: "সার্ভার এরর — পেজ রিফ্রেশ করে আবার চেষ্টা করুন" };
  }
}

// Delete an order (cascades items + status log).
export async function deleteOrder(orderNumber) {
  try {
    const sb = await createClient();
    const { data: ord } = await sb
      .from("orders")
      .select("id")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (!ord) return { error: "অর্ডার পাওয়া যায়নি" };

    const { error } = await sb.from("orders").delete().eq("order_number", orderNumber);
    if (error) return { error: "মুছে ফেলা যায়নি" };

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    console.error("deleteOrder threw", e);
    return { error: "সার্ভার এরর — পেজ রিফ্রেশ করে আবার চেষ্টা করুন" };
  }
}

export { PIPELINE };
