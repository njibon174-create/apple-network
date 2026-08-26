// app/actions/customers.js — customer CRM server actions (owner-only).
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Record a payment against a customer's open receivables (credit_sales first, then
// EMI). Distributes the amount oldest-due-first and updates each record's paid/status.
// Returns { ok, applied, remaining }.
export async function recordCustomerPayment(customerId, amount) {
  const sb = await createClient();
  const amt = parseInt(amount, 10);
  if (!customerId) return { error: "কাস্টমার পাওয়া যায়নি" };
  if (!amt || amt <= 0) return { error: "পরিমাণ দিন" };

  let remaining = amt;

  // 1) Credit sales: oldest due date first (nulls last).
  const { data: credits } = await sb
    .from("credit_sales")
    .select("id, total_due, amount_paid, status")
    .eq("customer_id", customerId)
    .neq("status", "paid")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  for (const cr of credits || []) {
    if (remaining <= 0) break;
    const owed = cr.total_due - cr.amount_paid;
    const pay = Math.min(remaining, owed);
    const newPaid = cr.amount_paid + pay;
    const status = newPaid >= cr.total_due ? "paid" : "partial";
    const { error } = await sb
      .from("credit_sales")
      .update({ amount_paid: newPaid, status, updated_at: new Date().toISOString() })
      .eq("id", cr.id);
    if (error) return { error: "আপডেট ব্যর্থ" };
    remaining -= pay;
  }

  // 2) If anything left, apply to EMI (convert amount -> whole months paid).
  if (remaining > 0) {
    const { data: emis } = await sb
      .from("emis")
      .select("id, total_bdt, months, monthly_bdt, paid_months, status")
      .eq("customer_id", customerId)
      .neq("status", "completed")
      .order("start_date", { ascending: true });

    for (const e of emis || []) {
      if (remaining <= 0) break;
      const addMonths = Math.floor(remaining / e.monthly_bdt);
      if (addMonths <= 0) break;
      const newPaid = Math.min(e.months, e.paid_months + addMonths);
      const status = newPaid >= e.months ? "completed" : "active";
      const { error } = await sb
        .from("emis")
        .update({ paid_months: newPaid, status })
        .eq("id", e.id);
      if (error) return { error: "EMI আপডেট ব্যর্থ" };
      remaining -= addMonths * e.monthly_bdt;
    }
  }

  revalidatePath("/admin/customers");
  revalidatePath("/admin/credit");
  revalidatePath("/admin");
  return { ok: true, applied: amt, remaining };
}
