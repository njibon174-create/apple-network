// app/actions/crm.js — CRM server actions (owner-only).
// Covers: customer profile read/update, multi-phone management, multi-address
// management, type tracking with audit log, and a unified activity log.
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── helpers ────────────────────────────────────────────────────────────────

function sbNow() {
  return new Date().toISOString();
}

async function logActivity(sb, customerId, kind, summary, detail = null) {
  await sb
    .from("customer_activity_log")
    .insert({
      customer_id: customerId,
      kind,
      summary,
      detail: detail ? JSON.stringify(detail) : null,
    })
    .then(() => {})
    .catch((e) => console.error("activity log insert skipped:", e));
}

// ── customer profile ───────────────────────────────────────────────────────

export async function getCustomer(id) {
  try {
    const sb = await createClient();
    const result = {
      id: null,
      name: null,
      phone: null,
      email: null,
      type: "walk-in",
      note: null,
      created_at: null,
      updated_at: null,
      phones: [],
      addresses: [],
      typeLog: [],
      activities: [],
      credit_sales: [],
      orders: [],
      total_credit_due: 0,
      total_credit_paid: 0,
      emi_remaining: 0,
      credit_outstanding: 0,
      total_spent: 0,
    };
  
    // Base customer — select only columns that exist in all schema versions.
    try {
      const { data: customer } = await sb
        .from("customers")
        .select("id, name, phone, email, type, note, created_at, updated_at")
        .eq("id", id)
        .maybeSingle();
      if (!customer) return null;
      Object.assign(result, customer);
    } catch (e) {
      console.error("getCustomer: base fetch failed", e);
      return null;
    }
  
    // Phones — table may not exist yet.
    try {
      const { data: phones } = await sb
        .from("customer_phones")
        .select("id, phone, label, is_primary, created_at")
        .eq("customer_id", id)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });
      result.phones = phones || [];
    } catch (e) {
      console.error("getCustomer: phones fetch skipped", e);
      result.phones = [];
    }
  
    // Addresses.
    try {
      const { data: addresses } = await sb
        .from("customer_addresses")
        .select("id, label, full_address, area, city, division, zip, phone, is_default, created_at, updated_at")
        .eq("customer_id", id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      result.addresses = addresses || [];
    } catch (e) {
      console.error("getCustomer: addresses fetch skipped", e);
      result.addresses = [];
    }
  
    // Type log.
    try {
      const { data: typeLog } = await sb
        .from("customer_type_log")
        .select("id, from_type, to_type, reason, created_at")
        .eq("customer_id", id)
        .order("created_at", { ascending: false });
      result.typeLog = typeLog || [];
    } catch (e) {
      console.error("getCustomer: typeLog fetch skipped", e);
      result.typeLog = [];
    }
  
    // Activity log.
    try {
      const { data: activities } = await sb
        .from("customer_activity_log")
        .select("id, kind, summary, detail, created_at")
        .eq("customer_id", id)
        .order("created_at", { ascending: false })
        .limit(500);
      const enriched = (activities || []).map((a) => {
        let detail = a.detail;
        if (typeof detail === "string") {
          try { detail = JSON.parse(detail); } catch { detail = null; }
        }
        return { ...a, detail };
      });
      result.activities = enriched;
    } catch (e) {
      console.error("getCustomer: activities fetch skipped", e);
      result.activities = [];
    }
  
    // Credit summary.
    try {
      const { data: creditSummary } = await sb
        .from("credit_sales")
        .select("id, total_due, amount_paid, due_date, status")
        .eq("customer_id", id);
      const creditSalesList = creditSummary || [];
      result.credit_sales = creditSalesList;
      result.total_credit_due = creditSalesList.reduce((s, c) => s + (c.total_due || 0), 0);
      result.total_credit_paid = creditSalesList.reduce((s, c) => s + (c.amount_paid || 0), 0);
    } catch (e) {
      console.error("getCustomer: credit fetch skipped", e);
      result.credit_sales = [];
    }
  
    // EMI summary.
    try {
      const { data: emiList } = await sb
        .from("emis")
        .select("id, total_bdt, months, monthly_bdt, paid_months, status")
        .eq("customer_id", id);
      result.emi_remaining = (emiList || []).reduce((s, e) => s + (e.total_bdt || 0) - (e.monthly_bdt || 0) * (e.paid_months || 0), 0);
    } catch (e) {
      console.error("getCustomer: emi fetch skipped", e);
      result.emi_remaining = 0;
    }
  
    // Orders for this customer (for total_spent + order count).
    try {
      const { data: orders } = await sb
        .from("orders")
        .select("id, order_number, total_bdt, status, created_at")
        .eq("customer_id", id)
        .order("created_at", { ascending: false })
        .limit(100);
      result.orders = orders || [];
      result.total_spent = (orders || []).reduce((s, o) => s + (o.total_bdt || 0), 0);
    } catch (e) {
      console.error("getCustomer: orders fetch skipped", e);
      result.orders = [];
    }
  
    result.credit_outstanding = result.total_credit_due - result.total_credit_paid + result.emi_remaining;
  
    return result;
  } catch (error) {
    console.error("Error in crm.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function updateCustomerProfile(id, { name, email, note, type }) {
  try {
    const sb = await createClient();
    const cur = await getCustomer(id);
    if (!cur) return { error: "কাস্টমার পাওয়া যায়নি" };
  
    const patch = {};
    if (name !== undefined && name !== cur.name) patch.name = name;
    if (email !== undefined && email !== cur.email) patch.email = email;
    if (note !== undefined && note !== cur.note) patch.note = note;
    if (type !== undefined && type !== cur.type) patch.type = type;
  
    if (type && type !== cur.type) {
      await sb
        .from("customer_type_log")
        .insert({
          customer_id: id,
          from_type: cur.type,
          to_type: type,
          reason: note || "টাইপ পরিবর্তন",
        })
        .then(() => {})
        .catch((e) => console.error("type log insert skipped:", e));
    }
  
    if (Object.keys(patch).length) {
      await sb
        .from("customers")
        .update({ ...patch, updated_at: sbNow() })
        .eq("id", id);
    }
  
    // always log an activity so the profile view shows a live audit trail
    await logActivity(
      sb,
      id,
      "customer_updated",
      `প্রোফাইল আপডেট: ${Object.keys(patch).map((k) => k === "type" ? `টাইপ → ${type}` : `${k} পরিবর্তন`).join(", ")}`,
      { patch }
    );
  
    revalidatePath("/admin/crm");
    revalidatePath("/admin/crm/" + id);
    return { ok: true };
  } catch (error) {
    console.error("Error in crm.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ── Direct CRM Sales (New Implementation) ──────────────────────────────────

export async function recordDirectSale(customerId, { productId, amount, paymentMethod }) {
  try {
    const sb = await createClient();
    
    // 1. Reduce Stock
    const { error: stockError } = await sb
      .from("stock_ledger")
      .update({ qty: (await sb.from("stock_ledger").select("qty").eq("product_id", productId).single()).data?.qty - 1 })
      .eq("product_id", productId);
    
    if (stockError) throw new Error("স্টক আপডেট করতে ব্যর্থ হয়েছে");

    // 2. Handle Payment
    if (paymentMethod === "cash") {
      // Record in Cash Book as Income
      await sb.from("cash_book").insert({
        amount: amount,
        type: "income",
        category: "sales",
        description: `Direct CRM Sale to customer ${customerId}`,
        created_at: sbNow()
      });
    } else if (paymentMethod === "credit") {
      // Record in Credit Sales
      await sb.from("credit_sales").insert({
        customer_id: customerId,
        total_due: amount,
        amount_paid: 0,
        status: "pending",
        created_at: sbNow()
      });
      
      // Update Customer Credit Outstanding (Increment)
      const { data: customer } = await sb.from("customers").select("credit_outstanding").eq("id", customerId).single();
      await sb.from("customers").update({ 
        credit_outstanding: (customer?.credit_outstanding || 0) + amount 
      }).eq("id", customerId);
    }

    // 3. Log Activity
    const product = await sb.from("products").select("name").eq("id", productId).single();
    await logActivity(
      sb,
      customerId,
      "direct_sale",
      `সরাসরি বিক্রয়: ${product.data?.name || "প্রোডাক্ট"} — ${paymentMethod === "cash" ? "নগদ" : "ক্রেডিট"} (${amount} ৳)`,
      { productId, amount, paymentMethod }
    );

    revalidatePath("/admin/crm/" + customerId);
    revalidatePath("/admin/crm");
    return { ok: true };
  } catch (error) {
    console.error("Error in recordDirectSale:", error);
    return { success: false, error: error.message || "বিক্রয় রেকর্ড করতে ব্যর্থ হয়েছে" };
  }
}

// ── phones ──────────────────────────────────────────────────────────────────

export async function addPhone(customerId, { phone, label }) {
  try {
    const sb = await createClient();
    if (!phone || !phone.trim()) return { error: "ফোন নম্বর দিন" };
    const clean = phone.trim();
  
    // duplicate check
    const { data: dup } = await sb
      .from("customer_phones")
      .select("id")
      .eq("customer_id", customerId)
      .eq("phone", clean)
      .maybeSingle();
    if (dup) return { error: "এই নম্বরটি ইতিমধ্যে যোগ করা আছে" };
  
    const isPrimary = !(await sb.from("customer_phones").select("id").eq("customer_id", customerId).maybeSingle());
    const { data: row } = await sb
      .from("customer_phones")
      .insert({
        customer_id: customerId,
        phone: clean,
        label: label || null,
        is_primary: isPrimary,
      })
      .select("id, phone, label, is_primary, created_at")
      .single();
  
    await logActivity(
      sb,
      customerId,
      "phone_added",
      `নতুন ফোন নম্বর: ${clean}${isPrimary ? " (প্রাথমিক)" : ""}`,
      { phone: clean, label, isPrimary }
    );
  
    revalidatePath("/admin/crm/" + customerId);
    return { ok: true, phone: row };
  } catch (error) {
    console.error("Error in crm.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function removePhone(customerId, phoneId) {
  try {
    const sb = await createClient();
    const { data: phone } = await sb
      .from("customer_phones")
      .select("id, phone, is_primary")
      .eq("id", phoneId)
      .eq("customer_id", customerId)
      .maybeSingle();
    if (!phone) return { error: "ফোন পাওয়া যায়নি" };
    if (phone.is_primary) return { error: "প্রাথমিক নম্বরটি মুছতে পারবেন না — অন্য নম্বরটিকে প্রাথমিক করুন" };
  
    await sb.from("customer_phones").delete().eq("id", phoneId);
  
    await logActivity(sb, customerId, "phone_removed", `ফোন নম্বর মুছেছে: ${phone.phone}`, { phone: phone.phone });
  
    revalidatePath("/admin/crm/" + customerId);
    return { ok: true };
  } catch (error) {
    console.error("Error in crm.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function setPrimaryPhone(customerId, phoneId) {
  try {
    const sb = await createClient();
    const { data: phone } = await sb
      .from("customer_phones")
      .select("id, phone, is_primary")
      .eq("id", phoneId)
      .eq("customer_id", customerId)
      .maybeSingle();
    if (!phone) return { error: "ফোন পাওয়া যায়নি" };
  
    // unset all primary for this customer, set the chosen one
    await sb
      .from("customer_phones")
      .update({ is_primary: false })
      .eq("customer_id", customerId);
    await sb
      .from("customer_phones")
      .update({ is_primary: true })
      .eq("id", phoneId);
  
    await logActivity(
      sb,
      customerId,
      "phone_set_primary",
      `প্রাথমিক ফোন পরিবর্তন: ${phone.phone}`,
      { phone: phone.phone }
    );
  
    revalidatePath("/admin/crm/" + customerId);
    return { ok: true };
  } catch (error) {
    console.error("Error in crm.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ── addresses ───────────────────────────────────────────────────────────────

export async function addAddress(customerId, {
  label, full_address, area, city, division, zip, phone, is_default
}) {
  try {
    const sb = await createClient();
    if (!full_address || !full_address.trim()) return { error: "ঠিকানা দিন" };
    const isDef = is_default === true;
  
    // if this is the first address or marked default, clear other defaults
    if (isDef) {
      await sb
        .from("customer_addresses")
        .update({ is_default: false })
        .eq("customer_id", customerId);
    }
  
    const { data: row } = await sb
      .from("customer_addresses")
      .insert({
        customer_id: customerId,
        label: label || "বাড়ি",
        full_address: full_address.trim(),
        area: area || null,
        city: city || null,
        division: division || null,
        zip: zip || null,
        phone: phone || null,
        is_default: isDef,
      })
      .select("id, label, full_address, area, city, division, zip, phone, is_default, created_at, updated_at")
      .single();
  
    await logActivity(
      sb,
      customerId,
      "address_added",
      `ঠিকানা যোগ: ${label || "বাড়ি"} — ${full_address.trim()}`,
      { addressId: row.id, label: label || "বাড়ি", full_address: full_address.trim() }
    );
  
    revalidatePath("/admin/crm/" + customerId);
    return { ok: true, address: row };
  } catch (error) {
    console.error("Error in crm.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function updateAddress(customerId, addressId, {
  label, full_address, area, city, division, zip, phone, is_default
}) {
  try {
    const sb = await createClient();
    const cur = await sb
      .from("customer_addresses")
      .select("id, full_address, is_default")
      .eq("id", addressId)
      .eq("customer_id", customerId)
      .maybeSingle();
    if (!cur) return { error: "ঠিকানা পাওয়া যায়নি" };
    if (!full_address || !full_address.trim()) return { error: "ঠিকানা দিন" };
  
    const isDef = is_default === true;
    if (isDef && !cur.is_default) {
      await sb
        .from("customer_addresses")
        .update({ is_default: false })
        .eq("customer_id", customerId);
    }
  
    const patch = { full_address: full_address.trim() };
    if (label !== undefined) patch.label = label;
    if (area !== undefined) patch.area = area;
    if (city !== undefined) patch.city = city;
    if (division !== undefined) patch.division = division;
    if (zip !== undefined) patch.zip = zip;
    if (phone !== undefined) patch.phone = phone;
    if (is_default !== undefined) patch.is_default = Boolean(is_default);
  
    await sb.from("customer_addresses").update({ ...patch, updated_at: sbNow() }).eq("id", addressId);
  
    await logActivity(
      sb,
      customerId,
      "address_updated",
      `ঠিকানা আপডেট: ${label || cur.label || "বাড়ি"} — ${full_address.trim()}`,
      { addressId, patch }
    );
  
    revalidatePath("/admin/crm/" + customerId);
    return { ok: true };
  } catch (error) {
    console.error("Error in crm.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function removeAddress(customerId, addressId) {
  try {
    const sb = await createClient();
    const { data: addr } = await sb
      .from("customer_addresses")
      .select("id, label, full_address")
      .eq("id", addressId)
      .eq("customer_id", customerId)
      .maybeSingle();
    if (!addr) return { error: "ঠিকানা পাওয়া যায়নি" };
  
    await sb.from("customer_addresses").delete().eq("id", addressId);
  
    await logActivity(
      sb,
      customerId,
      "address_removed",
      `ঠিকানা মুছেছে: ${addr.label || "বাড়ি"} — ${addr.full_address}`,
      { addressId: addr.id }
    );
  
    revalidatePath("/admin/crm/" + customerId);
    return { ok: true };
  } catch (error) {
    console.error("Error in crm.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function changeCustomerType(customerId, toType, reason) {
  try {
    const sb = await createClient();
    const cur = await getCustomer(customerId);
    if (!cur) return { error: "কাস্টমার পাওয়া যায়নি" };
    if (toType === cur.type) return { ok: true };
  
    await sb
      .from("customers")
      .update({ type: toType, updated_at: sbNow() })
      .eq("id", customerId);
  
    await sb
      .from("customer_type_log")
      .insert({
        customer_id: customerId,
        from_type: cur.type,
        to_type: toType,
        reason: reason || null,
      })
      .then(() => {})
      .catch((e) => console.error("type log insert skipped", e));
  
    await logActivity(
      sb,
      customerId,
      "type_changed",
      `টাইপ পরিবর্তন: ${cur.type} → ${toType}${reason ? ` (${reason})` : ""}`,
      { fromType: cur.type, toType, reason }
    );
  
    revalidatePath("/admin/crm/" + customerId);
    revalidatePath("/admin/crm");
    return { ok: true };
  } catch (error) {
    console.error("Error in crm.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}
