// app/actions/credit.js — Credit Management server actions.
// Covers: credit memos, payment tracking, overdue alerts, CRM credit summary.
// Owner-only via RLS (is_owner()).
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── helpers ──────────────────────────────────────────────────────────────
function sbNow() {
  return new Date().toISOString();
}

// ── create credit sale (বাকি) ───────────────────────────────────────────
export async function createCreditSale({ order_id, customer_id, total_due, due_date, note }) {
  try {
    const sb = await createClient();
    const total = parseInt(total_due, 10);
    if (!total || total <= 0) return { error: "বৈধ পরিমাণ দিন" };
    if (!customer_id) return { error: "কাস্টমার আইডি আবশ্যক" };
  
    const dd = due_date ? new Date(due_date).toISOString() : null;
  
    const { error } = await sb.from("credit_sales").insert({
      order_id: order_id || null,
      customer_id,
      total_due: total,
      amount_paid: 0,
      due_date: dd,
      status: "open",
      note: (note || "").trim() || null,
    });
    if (error) {
      console.error("createCreditSale failed", error);
      return { error: "ক্রেডিট সেল তৈরি ব্যর্থ" };
    }
  
    revalidatePath("/admin/credit");
    revalidatePath("/admin/crm");
    return { ok: true };
  } catch (error) {
    console.error("Error in credit.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ── record payment against a credit sale ────────────────────────────────
export async function recordPayment({ credit_sale_id, amount_bdt, method, note }) {
  try {
    const sb = await createClient();
    const amt = parseInt(amount_bdt, 10);
    if (!amt || amt <= 0) return { error: "বৈধ পরিমাণ দিন" };
    if (!credit_sale_id) return { error: "ক্রেডিট সেল আইডি আবশ্যক" };
  
    // Insert payment record.
    const { error: pErr } = await sb.from("credit_payments").insert({
      credit_sale_id,
      amount_bdt: amt,
      method: (method || "cash").trim(),
      note: (note || "").trim() || null,
    });
    if (pErr) {
      console.error("recordPayment insert failed", pErr);
      return { error: "পেমেন্ট রেকর্ড ব্যর্থ" };
    }
  
    // Update credit_sales.
    const { data: cs } = await sb
      .from("credit_sales")
      .select("id, total_due, amount_paid, status, order_id")
      .eq("id", credit_sale_id)
      .maybeSingle();
    if (!cs) return { error: "ক্রেডিট সেল পাওয়া যায়নি" };
  
    const newPaid = Math.min(cs.amount_paid + amt, cs.total_due);
    let newStatus = cs.status;
    if (newPaid >= cs.total_due && cs.status !== "paid") {
      newStatus = "paid";
    } else if (newPaid > 0 && cs.status === "open") {
      newStatus = "partial";
    }
  
    const { error: uErr } = await sb
      .from("credit_sales")
      .update({ amount_paid: newPaid, status: newStatus, updated_at: sbNow() })
      .eq("id", credit_sale_id);
    if (uErr) console.error("recordPayment update failed", uErr);
  
    // Mirror into cash_transactions.
    const { error: cErr } = await sb.from("cash_transactions").insert({
      type: "sale",
      amount_bdt: amt,
      ref: `credit-${cs.id}`,
      note: `ক্রেডিট পেমেন্ট: ${cs.id}`,
      channel: "credit",
      source_order_id: cs.order_id,
    });
    if (cErr) console.error("recordPayment cash mirror failed", cErr);
  
    revalidatePath("/admin/credit");
    revalidatePath("/admin/crm");
    return { ok: true };
  } catch (error) {
    console.error("Error in credit.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ── issue a credit memo (adjustment / partial refund on credit sale) ────
export async function issueCreditMemo({ credit_sale_id, amount_bdt, reason }) {
  try {
    const sb = await createClient();
    const amt = parseInt(amount_bdt, 10);
    if (!amt || amt <= 0) return { error: "বৈধ পরিমাণ দিন" };
    if (!credit_sale_id) return { error: "ক্রেডিট সেল আইডি আবশ্যক" };
  
    const { data: cs } = await sb
      .from("credit_sales")
      .select("id, customer_id, order_id, total_due, amount_paid")
      .eq("id", credit_sale_id)
      .maybeSingle();
    if (!cs) return { error: "ক্রেডিট সেল পাওয়া যায়নি" };
  
    const { error } = await sb.from("credit_memos").insert({
      credit_sale_id,
      customer_id: cs.customer_id,
      order_id: cs.order_id,
      amount_bdt: amt,
      reason: (reason || "ক্রেডিট মেমো").trim(),
    });
    if (error) {
      console.error("issueCreditMemo failed", error);
      return { error: "ক্রেডিট মেমো তৈরি ব্যর্থ" };
    }
  
    // Reduce amount_paid on credit_sale (memo reduces what customer owes).
    const newPaid = Math.max(0, cs.amount_paid - amt);
    await sb
      .from("credit_sales")
      .update({ amount_paid: newPaid, status: newPaid >= cs.total_due ? "paid" : "partial" })
      .eq("id", credit_sale_id)
      .then(() => {})
      .catch((e) => console.error("memo update skipped:", e));
  
    revalidatePath("/admin/credit");
    revalidatePath("/admin/crm");
    return { ok: true };
  } catch (error) {
    console.error("Error in credit.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ── mark credit sale fully paid ─────────────────────────────────────────
export async function markCreditPaid(credit_sale_id) {
  try {
    const sb = await createClient();
    const { error } = await sb
      .from("credit_sales")
      .update({ status: "paid", updated_at: sbNow() })
      .eq("id", credit_sale_id);
    if (error) {
      console.error("markCreditPaid failed", error);
      return { error: "আপডেট ব্যর্থ" };
    }
    revalidatePath("/admin/credit");
    revalidatePath("/admin/crm");
    return { ok: true };
  } catch (error) {
    console.error("Error in credit.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ── delete a credit memo ────────────────────────────────────────────────
export async function deleteCreditMemo(memoId) {
  try {
    const sb = await createClient();
    const { error } = await sb.from("credit_memos").delete().eq("id", memoId);
    if (error) console.error("deleteCreditMemo failed", error);
    revalidatePath("/admin/credit");
    return { ok: true };
  } catch (error) {
    console.error("Error in credit.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ── get overdue credits (due_date < now AND not paid) ──────────────────
export async function getOverdueCredits() {
  try {
    const sb = await createClient();
    const { data } = await sb
      .from("credit_sales")
      .select("id, total_due, amount_paid, due_date, status, customers(name, phone)")
      .lt("due_date", sbNow())
      .neq("status", "paid")
      .order("due_date", { ascending: true });
    return data || [];
  } catch (error) {
    console.error("Error in credit.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ── customer credit summary for CRM ─────────────────────────────────────
export async function getCustomerCreditSummary(customerId) {
  try {
    const sb = await createClient();
    const { data: credits } = await sb
      .from("credit_sales")
      .select("id, total_due, amount_paid, due_date, status, created_at, order_number")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
  
    const { data: emis } = await sb
      .from("emis")
      .select("id, total_bdt, months, monthly_bdt, paid_months, status, start_date")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
  
    const { data: memos } = await sb
      .from("credit_memos")
      .select("id, amount_bdt, reason, issued_at")
      .eq("customer_id", customerId)
      .order("issued_at", { ascending: false });
  
    const { data: payments } = await sb
      .from("credit_payments")
      .select("id, amount_bdt, payment_date, method, note")
      .in("credit_sale_id", (credits || []).map((c) => c.id));
  
    const totalCreditDue = (credits || []).reduce((s, c) => s + c.total_due, 0);
    const totalCreditPaid = (credits || []).reduce((s, c) => s + c.amount_paid, 0);
    const totalEmiRemaining = (emis || []).reduce((s, e) => s + e.total_bdt - e.monthly_bdt * e.paid_months, 0);
    const totalMemos = (memos || []).reduce((s, m) => s + m.amount_bdt, 0);
    const totalPayments = (payments || []).reduce((s, p) => s + p.amount_bdt, 0);
  
    return {
      credits: credits || [],
      emis: emis || [],
      memos: memos || [],
      payments: payments || [],
      totalCreditDue,
      totalCreditPaid,
      totalEmiRemaining,
      totalMemos,
      totalPayments,
      outstanding: totalCreditDue - totalCreditPaid + totalEmiRemaining - totalMemos,
    };
  } catch (error) {
    console.error("Error in credit.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ── get all credit memos ────────────────────────────────────────────────
export async function getAllCreditMemos() {
  try {
    const sb = await createClient();
    const { data } = await sb
      .from("credit_memos")
      .select(
        "id, credit_sale_id, customer_id, order_id, amount_bdt, reason, issued_at, created_at, customers(name, phone)"
      )
      .order("created_at", { ascending: false });
    return data || [];
  } catch (error) {
    console.error("Error in credit.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ── get credit payments (all) ───────────────────────────────────────────
export async function getAllCreditPayments() {
  try {
    const sb = await createClient();
    const { data } = await sb
      .from("credit_payments")
      .select(
        "id, credit_sale_id, amount_bdt, payment_date, method, note, created_at, credit_sales(total_due, amount_paid, status, customers(name, phone))"
      )
      .order("payment_date", { ascending: false });
    return data || [];
  } catch (error) {
    console.error("Error in credit.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}
