// app/actions/returns.js — server actions for Returns Management.
// Covers: create, approve, reject, process (restock + refund), status tracking.
// Owner-only via RLS (is_owner()).
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── create return ────────────────────────────────────────────────────────
export async function createReturn({
  order_number,
  product_name,
  product_id,
  reason,
  condition,
  qty,
  refund_bdt,
  restock,
}) {
  try {
    const sb = await createClient();
    const name = (product_name || "").trim();
    const pid = product_id || null;
    if (!name && !pid) return { error: "পণ্যের নাম বা আইডি আবশ্যক" };
  
    const amt = parseInt(refund_bdt, 10) || 0;
    const doRestock = restock !== false;
    const ordNum = (order_number || "").trim() || null;
    const cond = condition || null;
    const quantity = parseInt(qty, 10) || 1;
  
    // Resolve order_id from order_number (optional).
    let orderId = null;
    if (ordNum) {
      const { data: o } = await sb
        .from("orders")
        .select("id")
        .eq("order_number", ordNum)
        .maybeSingle();
      orderId = o?.id || null;
    }
  
    const { error } = await sb.from("returns").insert({
      order_id: orderId,
      order_number: ordNum,
      product_name: name,
      product_id: pid,
      reason: (reason || "").trim() || null,
      condition: cond,
      qty: quantity,
      refund_bdt: amt,
      restock: doRestock,
      status: "pending",
    });
    if (error) {
      console.error("createReturn failed", error);
      return { error: "রিটার্ন সংরক্ষণ ব্যর্থ হয়েছে" };
    }
  
    revalidatePath("/admin/returns");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    console.error("Error in returns.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ── approve return (status: pending → approved) ─────────────────────────
export async function approveReturn(returnId, note) {
  try {
    return changeReturnStatus(returnId, "approved", note);
  } catch (error) {
    console.error("Error in returns.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ── reject return (status: pending → rejected) ──────────────────────────
export async function rejectReturn(returnId, note) {
  try {
    return changeReturnStatus(returnId, "rejected", note);
  } catch (error) {
    console.error("Error in returns.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ── process return: restock + refund + status → refunded ────────────────
export async function processReturn(returnId, restockQty) {
  try {
    const sb = await createClient();
    const { data: ret } = await sb
      .from("returns")
      .select("id, product_id, product_name, qty, refund_bdt, restock, status, order_id, order_number")
      .eq("id", returnId)
      .maybeSingle();
    if (!ret) return { error: "রিটার্ন পাওয়া যায়নি" };
    if (ret.status !== "approved")
      return { error: "শুধুমাত্র অনুমোদিত রিটার্ন প্রক্রিয়া করা যায়" };
  
    const doRestock = ret.restock && restockQty !== false;
    const restockQ = doRestock ? (parseInt(restockQty, 10) || ret.qty || 1) : 0;
  
    // 1. Restock into stock_ledger.
    if (doRestock && restockQ > 0) {
      let pid = ret.product_id;
      let pname = ret.product_name;
      if (pid) {
        const { data: led } = await sb
          .from("stock_ledger")
          .select("qty")
          .eq("product_id", pid)
          .maybeSingle();
        const cur = led?.qty || 0;
        await sb.from("stock_ledger").upsert(
          {
            product_id: pid,
            qty: cur + restockQ,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "product_id" }
        );
      } else if (pname) {
        // Legacy fallback: match by name.
        const { data: prod } = await sb
          .from("products")
          .select("id")
          .eq("name", pname)
          .maybeSingle();
        if (prod) {
          const { data: led } = await sb
            .from("stock_ledger")
            .select("qty")
            .eq("product_id", prod.id)
            .maybeSingle();
          const cur = led?.qty || 0;
          await sb.from("stock_ledger").upsert(
            {
              product_id: prod.id,
              qty: cur + restockQ,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "product_id" }
          );
        }
      }
    }
  
    // 2. Debit cash for refund.
    if (ret.refund_bdt > 0) {
      const { error: cErr } = await sb.from("cash_transactions").insert({
        type: "refund",
        amount_bdt: ret.refund_bdt,
        ref: ret.order_number,
        note: `রিটার্ন: ${ret.product_name} (×${ret.qty})`,
        channel: "refund",
        source_order_id: ret.order_id,
      });
      if (cErr) console.error("processReturn cash debit failed", cErr);
    }
  
    // 3. Mark as refunded.
    return changeReturnStatus(returnId, "refunded", `স্টকে ফেরত ${restockQ} পিস · রিফান্ড ৳${ret.refund_bdt}`);
  } catch (error) {
    console.error("Error in returns.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ── internal: change status with audit log ──────────────────────────────
async function changeReturnStatus(returnId, newStatus, note) {
  const sb = await createClient();
  const { data: cur } = await sb
    .from("returns")
    .select("id, status")
    .eq("id", returnId)
    .maybeSingle();
  if (!cur) return { error: "রিটার্ন পাওয়া যায়নি" };

  // Get current user for processed_by.
  const { data: { user } } = await sb.auth.getUser();

  const { error: uErr } = await sb
    .from("returns")
    .update({ status: newStatus, processed_by: user?.id || null })
    .eq("id", returnId);
  if (uErr) {
    console.error("changeReturnStatus update failed", uErr);
    return { error: "স্ট্যাটাস আপডেট ব্যর্থ" };
  }

  // Audit log.
  await sb
    .from("return_status_log")
    .insert({
      return_id: returnId,
      from_status: cur.status,
      to_status: newStatus,
      note: note || null,
    })
    .then(() => {})
    .catch((e) => console.error("return_status_log insert skipped:", e));

  revalidatePath("/admin/returns");
  revalidatePath("/admin");
  return { ok: true };
}

// ── get return by id ─────────────────────────────────────────────────────
export async function getReturn(id) {
  try {
    const sb = await createClient();
    const { data } = await sb
      .from("returns")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data;
  } catch (error) {
    console.error("Error in returns.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ── get return status log ────────────────────────────────────────────────
export async function getReturnStatusLog(returnId) {
  try {
    const sb = await createClient();
    const { data } = await sb
      .from("return_status_log")
      .select("from_status, to_status, note, created_at")
      .eq("return_id", returnId)
      .order("created_at", { ascending: false });
    return data || [];
  } catch (error) {
    console.error("Error in returns.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}
