// app/admin/customers/page.jsx — CRM: customer list with their orders (owner-only).
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const sb = await createClient();
  const { data: customers } = await sb
    .from("customers")
    .select("id, name, phone, type, created_at, orders(id, order_number, status, total_bdt, created_at)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">কাস্টমার (CRM)</h1>
      <p className="mt-1 text-sm text-ink-muted">{(customers || []).length} জন কাস্টমার</p>

      <div className="mt-6 space-y-3">
        {(customers || []).map((c) => {
          const orders = c.orders || [];
          const spent = orders.reduce((s, o) => s + (o.total_bdt || 0), 0);
          return (
            <div key={c.id} className="rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-ink">{c.name || "—"}</p>
                  <p className="text-sm text-ink-soft">{c.phone || ""}</p>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-ink-muted">{c.type}</span>
                </div>
                <div className="text-right text-sm">
                  <p className="text-ink-soft">অর্ডার: {orders.length}</p>
                  <p className="font-semibold text-brand">{taka(spent)}</p>
                </div>
              </div>
              {orders.length > 0 && (
                <div className="mt-3 border-t border-gray-50 pt-2">
                  {orders.slice(0, 3).map((o) => (
                    <p key={o.id} className="text-xs text-ink-muted">
                      {o.order_number} · {o.status} · {taka(o.total_bdt)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {!customers?.length && (
          <p className="rounded-lg bg-white p-8 text-center text-sm text-ink-muted">কোনো কাস্টমার নেই।</p>
        )}
      </div>
    </div>
  );
}
