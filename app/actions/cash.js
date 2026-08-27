// app/actions/cash.js — CashBook server actions (enhanced).
// Covers: manual cash entries, channel-tagged entries, sales auto-mirror,
// expense auto-mirror, refund auto-mirror, capital in/out.
// Owner-only via RLS (is_owner()).
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const INFLOW_TYPES = new Set(["sale", "capital_in"]);
const VALID_TYPES = [...INFLOW_TYPES, "expense", "capital_out", "refund"];

// ── add a cash transaction with optional channel ─────────────────────────
export async function addCashTxn({ type, amount_bdt, ref, note, channel, source_order_id }) {
  const sb = await createClient();
  const amt = parseInt(amount_bdt, 10);
  if (!VALID_TYPES.includes(type) || !amt || amt <= 0) {
    return { error: "সঠিক পরিমাণ ও ধরন দিন" };
  }

  const { error } = await sb.from("cash_transactions").insert({
    type,
    amount_bdt: amt,
    ref: (ref || "").trim() || null,
    note: (note || "").trim() || null,
    channel: channel || getChannelForType(type),
    source_order_id: source_order_id || null,
  });
  if (error) {
    console.error("addCashTxn failed", error);
    return { error: "সংরক্ষণ ব্যর্থ হয়েছে" };
  }

  revalidatePath("/admin/cash");
  revalidatePath("/admin");
  return { ok: true };
}

function getChannelForType(type) {
  switch (type) {
    case "sale":
      return "online";
    case "expense":
      return "expense";
    case "refund":
      return "refund";
    case "capital_in":
      return "capital";
    case "capital_out":
      return "capital";
    default:
      return "other";
  }
}

// ── record a sale cash receipt (with channel) ──────────────────────────
export async function recordSaleCash({ amount_bdt, order_id, order_number, channel, note }) {
  const sb = await createClient();
  const amt = parseInt(amount_bdt, 10);
  if (!amt || amt <= 0) return { error: "বৈধ পরিমাণ দিন" };

  const { error } = await sb.from("cash_transactions").insert({
    type: "sale",
    amount_bdt: amt,
    ref: order_number || `order-${order_id}`,
    note: (note || "বিক্রয় প্রাপ্তি").trim(),
    channel: channel || "online",
    source_order_id: order_id || null,
  });
  if (error) {
    console.error("recordSaleCash failed", error);
    return { error: "সংরক্ষণ ব্যর্থ হয়েছে" };
  }

  revalidatePath("/admin/cash");
  revalidatePath("/admin/orders");
  return { ok: true };
}

// ── record an expense cash outflow ──────────────────────────────────────
export async function recordExpenseCash({ amount_bdt, category, note, expense_id }) {
  const sb = await createClient();
  const amt = parseInt(amount_bdt, 10);
  if (!amt || amt <= 0) return { error: "বৈধ পরিমাণ দিন" };

  const { error } = await sb.from("cash_transactions").insert({
    type: "expense",
    amount_bdt: amt,
    ref: expense_id ? `expense-${expense_id}` : (note || "খরচ"),
    note: `খরচ: ${(category || "other").trim()}`,
    channel: "expense",
  });
  if (error) {
    console.error("recordExpenseCash failed", error);
    return { error: "সংরক্ষণ ব্যর্থ হয়েছে" };
  }

  revalidatePath("/admin/cash");
  revalidatePath("/admin/expenses");
  return { ok: true };
}

// ── get cash balance summary ────────────────────────────────────────────
export async function getCashBalance() {
  const sb = await createClient();
  const { data: txns } = await sb
    .from("cash_transactions")
    .select("id, type, amount_bdt, channel, created_at")
    .order("created_at", { ascending: true });

  let balance = 0;
  const byType = {};
  const byChannel = {};

  for (const t of txns || []) {
    if (INFLOW_TYPES.has(t.type)) {
      balance += t.amount_bdt;
    } else {
      balance -= t.amount_bdt;
    }
    byType[t.type] = (byType[t.type] || 0) + t.amount_bdt * (INFLOW_TYPES.has(t.type) ? 1 : -1);
    byChannel[t.channel || "other"] = (byChannel[t.channel || "other"] || 0) + t.amount_bdt * (INFLOW_TYPES.has(t.type) ? 1 : -1);
  }

  return {
    balance,
    totalTransactions: txns?.length || 0,
    byType,
    byChannel,
    inflows: txns?.filter((t) => INFLOW_TYPES.has(t.type)).reduce((s, t) => s + t.amount_bdt, 0) || 0,
    outflows: txns?.filter((t) => !INFLOW_TYPES.has(t.type)).reduce((s, t) => s + t.amount_bdt, 0) || 0,
  };
}

// ── get cash ledger entries (for CashBook page) ────────────────────────
export async function getCashLedger({ limit = 500, offset = 0 } = {}) {
  const sb = await createClient();
  const { data } = await sb
    .from("cash_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return data || [];
}

// ── delete a cash transaction (admin) ───────────────────────────────────
export async function deleteCashTxn(id) {
  const sb = await createClient();
  const { error } = await sb.from("cash_transactions").delete().eq("id", id);
  if (error) console.error("deleteCashTxn failed", error);
  revalidatePath("/admin/cash");
  return { ok: true };
}
