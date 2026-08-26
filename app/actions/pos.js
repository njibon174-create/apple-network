// app/actions/pos.js — Point-of-Sale: sell from the shop (owner-only).
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { upsertCustomerByPhone } from "@/lib/customers";

// items: [{ product_id, qty, unit_price_bdt }]
// payment: 'cash' | 'card' | 'bkash' | 'nagad' | 'credit' | 'emi'
// For credit/emi: customer_name, customer_phone, due_date (credit), months (emi)
export async function createPosSale({ items, payment, customer_name, customer_phone, due_date, emi_months, note }) {
  const sb = await createClient();
  if (!items?.length) return { error: "পণ্য যোগ করুন" };

  const total = items.reduce((s, i) => s + i.qty * i.unit_price_bdt, 0);

  // Auto-create / find customer by phone (B1: auto from phone). Links the order to
  // the CRM profile so every POS sale accumulates against the customer's phone.
  const customerType = payment === "credit" ? "credit" : payment === "emi" ? "emi" : "walk-in";
  const customerId = await upsertCustomerByPhone({
    phone: customer_phone,
    name: customer_name,
    type: customerType,
    note: note || null,
  });

  // Create the order (source = pos).
  const { data: order, error: oe } = await sb
    .from("orders")
    .insert({
      status: "confirmed",
      source: "pos",
      customer_id: customerId,
      subtotal_bdt: total,
      total_bdt: total,
      payment_method: payment,
      payment_status: payment === "credit" || payment === "emi" ? "pending" : "paid",
      shipping_name: customer_name || "ওয়াক-ইন",
      shipping_phone: customer_phone || "—",
      shipping_address: note || "",
      shipping_city: "",
      shipping_division: "",
      due_date: due_date || null,
    })
    .select("id, order_number")
    .single();
  if (oe) {
    console.error("pos order failed", oe);
    return { error: "অর্ডার তৈরি ব্যর্থ" };
  }

  // Insert order items + decrement stock_ledger.
  for (const it of items) {
    const { data: prod } = await sb.from("products").select("name, image_primary, price_bdt").eq("id", it.product_id).maybeSingle();
    await sb.from("order_items").insert({
      order_id: order.id,
      product_id: it.product_id,
      product_name: prod?.name || "পণ্য",
      product_image: prod?.image_primary || null,
      unit_price_bdt: it.unit_price_bdt,
      qty: it.qty,
      line_total_bdt: it.qty * it.unit_price_bdt,
    });
    // decrement stock
    const { data: led } = await sb.from("stock_ledger").select("qty").eq("product_id", it.product_id).maybeSingle();
    if (led) {
      await sb.from("stock_ledger").update({ qty: Math.max(0, led.qty - it.qty), updated_at: new Date().toISOString() }).eq("product_id", it.product_id);
    }
  }

  // Credit / EMI records.
  if (payment === "credit") {
    await sb.from("credit_sales").insert({
      order_id: order.id,
      customer_id: customerId,
      total_due: total,
      amount_paid: 0,
      due_date: due_date || null,
      status: "open",
    });
  }
  if (payment === "emi") {
    const months = parseInt(emi_months, 10) || 12;
    await sb.from("emis").insert({
      order_id: order.id,
      customer_id: customerId,
      total_bdt: total,
      months,
      monthly_bdt: Math.round(total / months),
      paid_months: 0,
      start_date: new Date().toISOString().slice(0, 10),
      status: "active",
    });
  }

  // Cash mirror (except credit/emi which are receivables).
  if (payment !== "credit" && payment !== "emi") {
    await sb.from("cash_transactions").insert({ type: "sale", amount_bdt: total, ref: order.order_number, note: "POS বিক্রয়" });
  }

  revalidatePath("/admin/pos");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/cash");
  revalidatePath("/admin/credit");
  revalidatePath("/admin");
  return { ok: true, order_number: order.order_number };
}
