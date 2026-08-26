// app/actions/cash.js — server action to add a manual capital transaction
// (owner-only; RLS on cash_transactions enforces is_owner()).
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Manually record capital in / capital out. Sales, expenses and refunds are
// written automatically by their own actions; this is for owner cash movements.
export async function addCashTxn({ type, amount_bdt, ref, note }) {
  const sb = await createClient();
  const amt = parseInt(amount_bdt, 10);
  if (!["capital_in", "capital_out"].includes(type) || !amt || amt <= 0) {
    return { error: "সঠিক পরিমাণ ও ধরন দিন" };
  }
  const { error } = await sb.from("cash_transactions").insert({
    type,
    amount_bdt: amt,
    ref: ref?.trim() || null,
    note: note?.trim() || null,
  });
  if (error) {
    console.error("addCashTxn failed", error);
    return { error: "সংরক্ষণ ব্যর্থ হয়েছে" };
  }
  revalidatePath("/admin/cash");
  revalidatePath("/admin");
  return { ok: true };
}
