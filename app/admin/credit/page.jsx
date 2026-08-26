// app/admin/credit/page.jsx — Credit receivables + EMI schedule (owner-only).
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CreditPage() {
  const sb = await createClient();
  const [{ data: credits }, { data: emis }] = await Promise.all([
    sb.from("credit_sales").select("id, total_due, amount_paid, due_date, status, customers(name, phone)").order("created_at", { ascending: false }),
    sb.from("emis").select("id, total_bdt, months, monthly_bdt, paid_months, status, customers(name, phone)").order("created_at", { ascending: false }),
  ]);

  const totalDue = (credits || []).reduce((s, c) => s + (c.total_due - c.amount_paid), 0);
  const totalEmi = (emis || []).reduce((s, e) => s + e.total_bdt - e.monthly_bdt * e.paid_months, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-ink">বাকি ও EMI</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-sm text-ink-muted">মোট বাকি (ক্রেডিট)</p>
          <p className="text-2xl font-bold text-red-600">{taka(totalDue)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-sm text-ink-muted">মোট বাকি (EMI)</p>
          <p className="text-2xl font-bold text-amber-600">{taka(totalEmi)}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-ink">ক্রেডিট বিক্রয়</h2>
        <div className="space-y-2">
          {(credits || []).map((c) => (
            <div key={c.id} className="rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">{c.customers?.name || "—"}</p>
                  <p className="text-xs text-ink-muted">{c.customers?.phone || ""}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "paid" ? "bg-green-100 text-green-700" : c.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                  {c.status === "paid" ? "পরিশোধিত" : c.status === "partial" ? "আংশিক" : "বাকি"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>মোট {taka(c.total_due)} · জমা {taka(c.amount_paid)} · বাকি {taka(c.total_due - c.amount_paid)}</span>
                {c.due_date && <span className="text-xs text-ink-muted">শেষ: {c.due_date}</span>}
              </div>
            </div>
          ))}
          {!credits?.length && <p className="text-sm text-ink-muted">কোনো ক্রেডিট বিক্রয় নেই</p>}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-ink">EMI স্কিডিউল</h2>
        <div className="space-y-2">
          {(emis || []).map((e) => (
            <div key={e.id} className="rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">{e.customers?.name || "—"}</p>
                  <p className="text-xs text-ink-muted">{e.months} মাস · {taka(e.monthly_bdt)}/মাস</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                  {e.paid_months}/{e.months} মাস
                </span>
              </div>
              <div className="mt-2 text-sm">
                মোট {taka(e.total_bdt)} · বাকি {taka(e.total_bdt - e.monthly_bdt * e.paid_months)}
              </div>
            </div>
          ))}
          {!emis?.length && <p className="text-sm text-ink-muted">কোনো EMI নেই</p>}
        </div>
      </div>
    </div>
  );
}
