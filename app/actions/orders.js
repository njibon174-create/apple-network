// app/actions/orders.js — server actions for order lifecycle (owner-only).
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// The full lifecycle pipeline (order matters for the UI).
export const ORDER_STEPS = [
  "new",
  "calling",
  "confirmed",
  "preparing",
  "shipping",
  "delivered",
];

// Advance/regress an order to a new status and record it in the audit log.
export async function updateOrderStatus(orderNumber, status, note) {
  try {
    const sb = await createClient();
    if (!status) return { error: "স্ট্যাটাস দিন" };
    const { data: cur } = await sb
      .from("orders")
      .select("id, status")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (!cur) return { error: "অর্ডার পাওয়া যায়নি" };
    if (cur.status === status) return { ok: true }; // no-op

    const { error } = await sb
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("order_number", orderNumber);
    if (error) {
      console.error("updateOrderStatus failed", error);
      return { error: "স্ট্যাটাস আপডেট ব্যর্থ" };
    }

    await sb.from("order_status_log").insert({
      order_id: cur.id,
      from_status: cur.status,
      to_status: status,
      note: note || null,
    }).then(() => {}).catch((e) => console.error("status_log insert skipped:", e));

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    revalidatePath("/track");
    return { ok: true };
  } catch (e) {
    console.error("updateOrderStatus threw", e);
    return { error: "সার্ভার এরর — পেজ রিফ্রেশ করে আবার চেষ্টা করুন" };
  }
}

// Delete an order (and its items / status log cascade). Owner-only.
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
    if (error) {
      console.error("deleteOrder failed", error);
      return { error: "মুছে ফেলা যায়নি" };
    }
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    console.error("deleteOrder threw", e);
    return { error: "সার্ভার এরর — পেজ রিফ্রেশ করে আবার চেষ্টা করুন" };
  }
}

// Mark that we called the customer (moves new -> calling, or logs a call attempt).
export async function logCall(orderNumber, note) {
  const sb = await createClient();
  const { data: cur } = await sb
    .from("orders")
    .select("id, status")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (!cur) return { error: "অর্ডার পাওয়া যায়নি" };

  // If still 'new', move to 'calling'.
  if (cur.status === "new") {
    await sb.from("orders").update({ status: "calling", updated_at: new Date().toISOString() }).eq("order_number", orderNumber);
  }
  await sb.from("order_status_log").insert({
    order_id: cur.id,
    from_status: cur.status,
    to_status: cur.status,
    note: note ? `📞 কল: ${note}` : "📞 কল করা হয়েছে",
  });

  revalidatePath("/admin/orders");
  return { ok: true };
}

// Record a partial / full payment against a credit sale.
export async function recordCreditPayment(creditId, amount) {
  const sb = await createClient();
  const amt = parseInt(amount, 10);
  if (!amt || amt <= 0) return { error: "পরিমাণ দিন" };
  const { data: cr } = await sb.from("credit_sales").select("*").eq("id", creditId).maybeSingle();
  if (!cr) return { error: "ক্রেডিট রেকর্ড পাওয়া যায়নি" };
  const newPaid = cr.amount_paid + amt;
  const status = newPaid >= cr.total_due ? "paid" : "partial";
  const { error } = await sb
    .from("credit_sales")
    .update({ amount_paid: newPaid, status, updated_at: new Date().toISOString() })
    .eq("id", creditId);
  if (error) return { error: "আপডেট ব্যর্থ" };
  revalidatePath("/admin/credit");
  return { ok: true };
}
