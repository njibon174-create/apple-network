// app/admin/customers/page.jsx — CRM: customer list with their orders + payment behavior (owner-only).
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";

export const dynamic = "force-dynamic";

// Customer type label / color.
const TYPE_LABEL = {
  "walk-in": "ওয়াক-ইন",
  credit: "ক্রেডিট",
  emi: "ইমি",
};
const TYPE_COLOR = {
  "walk-in": "bg-gray-100 text-ink-muted",
  credit: "bg-amber-100 text-amber-700",
  emi: "bg-blue-100 text-blue-700",
};

// Days past due → late payer flag. >0 = overdue, >7 = late payer.
const overdueDays = (dueDate) => {
  if (!dueDate) return null;
  const d = new Date(dueDate).getTime();
  const today = Date.now();
  const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
};

export default async function CustomersPage() {
  const sb = await createClient();
  const { data: customers } = await sb
    .from("customers")
    .select(`
      id, name, phone, type, note, created_at,
      orders!inner(id, order_number, status, total_bdt, payment_method, payment_status, created_at, customer_id),
      credit_sales(id, total_due, amount_paid, due_date, status)
    `)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">কাস্টমার (CRM)</h1>
      <p className="mt-1 text-sm text-ink-muted">{(customers || []).length} জন কাস্টমার</p>

      <div className="mt-6 space-y-4">
        {(customers || []).map((c) => {
          const orders = c.orders || [];
          const spent = orders.reduce((s, o) => s + (o.total_bdt || 0), 0);
          const paidOrders = orders.filter((o) => o.payment_status === "paid").length;
          const pendingOrders = orders.filter(
            (o) => o.payment_status !== "paid" && (o.payment_method === "bkash" || o.payment_method === "nagad" || o.payment_method === "card")
          ).length;

          // Credit/EMI receivables for this customer.
          const credits = c.credit_sales || [];
          const totalDue = credits.reduce((s, cr) => s + (cr.total_due - cr.amount_paid), 0);
          const overdue = credits
            .map((cr) => overdueDays(cr.due_date))
            .filter((d) => d !== null);
          const maxOverdue = overdue.length ? Math.max(...overdue) : 0;
          const isLatePayer = maxOverdue > 7 || pendingOrders > 0;

          return (
            <div key={c.id} className="rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{c.name || "—"}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[c.type] || TYPE_COLOR["walk-in"]}`}
                    >
                      {TYPE_LABEL[c.type] || c.type}
                    </span>
                    {isLatePayer && (
                      <span title="বাকি রয়েছে অগ্রাধিকার" className="text-red-500">⚠️ বিল অগ্রাধিকার</span>
                    )}
                  </div>
                  <p className="text-sm text-ink-soft">{c.phone || ""}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    প্রথম অর্ডার: {new Date(orders[orders.length - 1]?.created_at || c.created_at).toLocaleDateString("bn-BD")}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-ink-soft">অর্ডার: {orders.length}</p>
                  <p className="font-semibold text-brand">{taka(spent)}</p>
                  {credits.length > 0 && (
                    <p className={`text-xs ${totalDue > 0 ? "text-red-600" : "text-green-600"}`}>
                      বাকি: {taka(totalDue)}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment behavior summary */}
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {pendingOrders > 0 && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-700">
                    অপরিশোধিত অনলাইন ({pendingOrders})
                  </span>
                )}
                {maxOverdue > 0 && (
                  <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">
                    বাকি ওভারডু রয়েছে ({maxOverdue} দিন)
                  </span>
                )}
                {paidOrders > 0 && (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-green-700">
                    পূর্ণ পেমেন্ট {paidOrders}
                  </span>
                )}
              </div>

              {/* Recent orders */}
              {orders.length > 0 && (
                <div className="mt-3 border-t border-gray-50 pt-2">
                  {orders.slice(0, 3).map((o) => (
                    <div key={o.id} className="flex justify-between text-sm text-ink-soft">
                      <span>
                        {o.order_number} · {o.status} · {o.payment_method}
                      </span>
                      <span className={o.payment_status === "paid" ? "text-green-600" : "text-amber-600"}>
                        {o.payment_status === "paid" ? "পরিশোধিত" : "বাকি"} · {taka(o.total_bdt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {!orders.length && <p className="mt-2 text-xs text-ink-muted">এখনও কোনো অর্ডার নেই।</p>}
            </div>
          );
        })}
        {!customers?.length && (
          <p className="rounded-lg bg-white p-8 text-center text-sm text-ink-muted">
            কোনো কাস্টমার নেই।
          </p>
        )}
      </div>
    </div>
  );
}
