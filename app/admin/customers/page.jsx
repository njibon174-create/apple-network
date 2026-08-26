// app/admin/customers/page.jsx — CRM: customer list with their orders + payment behavior (owner-only).
import { createClient } from "@/lib/supabase/server";
import CustomerCard from "./CustomerCard";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const sb = await createClient();
  const { data: customers } = await sb
    .from("customers")
    .select(`
      id, name, phone, type, note, created_at,
      orders(id, order_number, status, total_bdt, payment_method, payment_status, created_at),
      credit_sales(id, total_due, amount_paid, due_date, status)
    `)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">কাস্টমার (CRM)</h1>
      <p className="mt-1 text-sm text-ink-muted">{(customers || []).length} জন কাস্টমার</p>

      <div className="mt-6 space-y-4">
        {(customers || []).map((c) => (
          <CustomerCard key={c.id} c={c} />
        ))}
        {!customers?.length && (
          <p className="rounded-lg bg-white p-8 text-center text-sm text-ink-muted">কোনো কাস্টমার নেই।</p>
        )}
      </div>
    </div>
  );
}
