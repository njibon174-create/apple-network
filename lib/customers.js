// lib/customers.js
// Why: single source of truth for linking an order to a customer by phone number.
// Both the website checkout (lib/orders.js -> createOrder) and the POS sale
// (app/actions/pos.js -> createPosSale) must call this so the CRM profile is
// always created/updated from the phone number (mobile is the unique key).
import { createClient } from "@/lib/supabase/server";

// Upsert a customer by phone. Returns the customer row id.
// `type` is 'online' | 'walk-in' | 'credit' | 'emi' — newer purchase types win
// (a credit buyer is still a credit buyer even if they later pay cash in-store).
export async function upsertCustomerByPhone({ phone, name, type, email, note }) {
  if (!phone || !phone.trim() || phone.trim() === "—") return null;
  const sb = await createClient();
  const cleanPhone = phone.trim();

  const { data: existing } = await sb
    .from("customers")
    .select("id, name, type, email")
    .eq("phone", cleanPhone)
    .maybeSingle();

  if (existing) {
    const nextType =
      type && type !== "online" && existing.type === "online" ? type : existing.type;
    const patch = {};
    if (name && !existing.name) patch.name = name;
    if (email && !existing.email) patch.email = email;
    if (nextType && nextType !== existing.type) patch.type = nextType;
    if (note) patch.note = note;
    if (Object.keys(patch).length) {
      await sb.from("customers").update(patch).eq("id", existing.id);
    }
    return existing.id;
  }

  const { data: created } = await sb
    .from("customers")
    .insert({
      name: name || "—",
      phone: cleanPhone,
      email: email || null,
      type: type || "online",
      note: note || null,
    })
    .select("id")
    .single();
  return created?.id || null;
}
