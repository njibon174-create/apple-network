// app/actions/expenses.js — server actions for the expenses ledger.
// Every expense is mirrored into cash_transactions (type='expense') so the
// cash book stays consistent. Owner-only via RLS (is_owner()).
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID = ["rent", "salary", "utility", "transport", "misc", "other"];

export async function addExpense({ category, amount_bdt, note }) {
  try {
    const sb = await createClient();
    const amt = parseInt(amount_bdt, 10);
    if (!VALID.includes(category) || !amt || amt <= 0) {
      return { error: "সঠিক ক্যাটাগরি ও পরিমাণ দিন" };
    }
    const { error } = await sb.from("expenses").insert({
      category,
      amount_bdt: amt,
      note: note?.trim() || null,
    });
    if (error) {
      console.error("addExpense failed", error);
      return { error: "সংরক্ষণ ব্যর্থ হয়েছে" };
    }
    // Mirror into cash book as an outflow.
    const { error: cErr } = await sb.from("cash_transactions").insert({
      type: "expense",
      amount_bdt: amt,
      ref: note?.trim() || null,
      note: `খরচ: ${category}`,
    });
    if (cErr) console.error("addExpense cash mirror failed", cErr);
  
    revalidatePath("/admin/expenses");
    revalidatePath("/admin/cash");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    console.error("Error in expenses.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function deleteExpense(id) {
  try {
    const sb = await createClient();
    if (!id) return;
    const { error } = await sb.from("expenses").delete().eq("id", id);
    if (error) console.error("deleteExpense failed", error);
    revalidatePath("/admin/expenses");
    revalidatePath("/admin/cash");
    revalidatePath("/admin");
  } catch (error) {
    console.error("Error in expenses.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}
