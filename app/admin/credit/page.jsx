// app/admin/credit/page.jsx — Credit Management: credit memos, payment tracking,
// overdue alerts, customer credit summary in CRM. Owner-only via RLS.
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function CreditPage() {
  const sb = await createClient();

  // Fetch everything in parallel.
  const [{ data: credits }, { data: emis }, { data: memos }, { data: payments }, { data: overdue }] =
    await Promise.all([
      sb.from("credit_sales").select("id, order_id, order_number, customer_id, total_due, amount_paid, due_date, status, note, created_at, updated_at, customers(name, phone)").order("created_at", { ascending: false }),
      sb.from("emis").select("id, order_id, customer_id, total_bdt, months, monthly_bdt, paid_months, start_date, status, created_at, customers(name, phone)").order("created_at", { ascending: false }),
      sb.from("credit_memos").select("id, credit_sale_id, customer_id, order_id, amount_bdt, reason, issued_at, created_at, customers(name, phone)").order("created_at", { ascending: false }),
      sb.from("credit_payments").select("id, credit_sale_id, amount_bdt, payment_date, method, note, created_at, credit_sales(total_due, amount_paid, status, customers(name, phone))").order("payment_date", { ascending: false }),
      sb.from("credit_sales").select("id, total_due, amount_paid, due_date, status, customers(name, phone)").lt("due_date", new Date().toISOString()).neq("status", "paid").order("due_date", { ascending: true }),
    ]);

  const creditList = credits || [];
  const emiList = emis || [];
  const memoList = memos || [];
  const paymentList = payments || [];
  const overdueList = overdue || [];

  // Totals.
  const totalCreditDue = creditList.reduce((s, c) => s + c.total_due, 0);
  const totalCreditPaid = creditList.reduce((s, c) => s + c.amount_paid, 0);
  const creditOutstanding = totalCreditDue - totalCreditPaid;
  const totalEmiRemaining = emiList.reduce((s, e) => s + e.total_bdt - e.monthly_bdt * e.paid_months, 0);
  const memoTotal = memoList.reduce((s, m) => s + m.amount_bdt, 0);

  // Overdue count by days.
  const now = new Date();
  const overdueByDays = overdueList.map((o) => {
    const due = new Date(o.due_date);
    const daysOverdue = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    return { ...o, daysOverdue };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Icon name="Wallet" size={22} className="text-amber-600" />
        <h1 className="text-xl font-semibold text-gray-800">ক্রেডিট ম্যানেজমেন্ট</h1>
      </div>

      {/* Alert banner for overdue */}
      {overdueList.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <Icon name="AlertTriangle" size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">সতর্কতা: {overdueList.length}টি ক্রেডিট বাকি পেমেন্ট ডেডলাইন পার হয়েছে</p>
              <p className="text-sm text-red-600 mt-1">
                দ্রুত কাস্টমারদের নোটিফিকেশন দিন এবং পেমেন্ট কালেকশন অনুসরণ করুন।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-xs text-gray-500">মোট ক্রেডিট বাকি (তোলা হয়েছে)</p>
          <p className="text-lg font-bold text-gray-800">{taka(totalCreditDue)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-xs text-gray-500">পরিশোধিত</p>
          <p className="text-lg font-bold text-emerald-600">{taka(totalCreditPaid)}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-white p-4">
          <p className="text-xs text-gray-500">বাকি রয়েছে</p>
          <p className="text-lg font-bold text-red-600">{taka(creditOutstanding)}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-white p-4">
          <p className="text-xs text-gray-500">EMI বাকি</p>
          <p className="text-lg font-bold text-amber-600">{taka(totalEmiRemaining)}</p>
        </div>
      </div>

      {/* Overdue alerts table */}
      {overdueList.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-red-700">
            <Icon name="AlertCircle" size={18} />
            ডেডলাইন পার লেনদেন ({overdueList.length})
          </h2>
          <div className="rounded-xl border border-gray-100 bg-white p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4">কাস্টমার</th>
                  <th className="py-2 pr-4">তোলা</th>
                  <th className="py-2 pr-4">পরিশোধিত</th>
                  <th className="py-2 pr-4">বাকি</th>
                  <th className="py-2 pr-4">ডেডলাইন</th>
                  <th className="py-2 pr-4">দিন পার হয়েছে</th>
                  <th className="py-2">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {overdueByDays.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50">
                    <td className="py-2 pr-4">
                      <span className="font-medium">{o.customers?.name || "—"}</span>
                      <p className="text-xs text-gray-500">{o.customers?.phone || ""}</p>
                    </td>
                    <td className="py-2 pr-4 text-gray-800">{taka(o.total_due)}</td>
                    <td className="py-2 pr-4 text-emerald-600">{taka(o.amount_paid)}</td>
                    <td className="py-2 pr-4 font-medium text-red-600">{taka(o.total_due - o.amount_paid)}</td>
                    <td className="py-2 pr-4 text-gray-600">{new Date(o.due_date).toLocaleDateString("bn-BD")}</td>
                    <td className="py-2 pr-4">
                      <span className={`font-semibold ${o.daysOverdue > 30 ? "text-red-600" : "text-amber-600"}`}>
                        {o.daysOverdue} দিন
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${o.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {o.status === "partial" ? "আংশিক" : "বাকি"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Credit Sales */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <Icon name="CreditCard" size={18} />
          ক্রেডিট বিক্রয় ({creditList.length})
        </h2>
        <div className="rounded-xl border border-gray-100 bg-white p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-4">তারিখ</th>
                <th className="py-2 pr-4">কাস্টমার</th>
                <th className="py-2 pr-4">অর্ডার</th>
                <th className="py-2 pr-4">তোলা</th>
                <th className="py-2 pr-4">পরিশোধিত</th>
                <th className="py-2 pr-4">বাকি</th>
                <th className="py-2 pr-4">ডেডলাইন</th>
                <th className="py-2">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {creditList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-gray-400">কোনো ক্রেডিট বিক্রয় নেই</td>
                </tr>
              )}
              {creditList.map((c) => (
                <tr key={c.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 text-gray-600">{new Date(c.created_at).toLocaleDateString("bn-BD")}</td>
                  <td className="py-2 pr-4">
                    <span className="font-medium">{c.customers?.name || "—"}</span>
                    <p className="text-xs text-gray-500">{c.customers?.phone || ""}</p>
                  </td>
                  <td className="py-2 pr-4 text-gray-600">{c.order_number || "—"}</td>
                  <td className="py-2 pr-4 text-gray-800">{taka(c.total_due)}</td>
                  <td className="py-2 pr-4 text-emerald-600">{taka(c.amount_paid)}</td>
                  <td className="py-2 pr-4 font-medium text-red-600">{taka(c.total_due - c.amount_paid)}</td>
                  <td className="py-2 pr-4 text-gray-600">{c.due_date ? new Date(c.due_date).toLocaleDateString("bn-BD") : "—"}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "paid" ? "bg-green-100 text-green-700" : c.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                      {c.status === "paid" ? "পরিশোধিত" : c.status === "partial" ? "আংশিক" : "বাকি"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMI Schedule */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <Icon name="Calendar" size={18} />
          EMI স্কিডিউল ({emiList.length})
        </h2>
        <div className="rounded-xl border border-gray-100 bg-white p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-4">তারিখ</th>
                <th className="py-2 pr-4">কাস্টমার</th>
                <th className="py-2 pr-4">মাস</th>
                <th className="py-2 pr-4">মাসিক</th>
                <th className="py-2 pr-4">ভরণ</th>
                <th className="py-2 text-right">বাকি</th>
                <th className="py-2">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {emiList.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-400">কোনো EMI নেই</td>
                </tr>
              )}
              {emiList.map((e) => (
                <tr key={e.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 text-gray-600">{new Date(e.created_at).toLocaleDateString("bn-BD")}</td>
                  <td className="py-2 pr-4">
                    <span className="font-medium">{e.customers?.name || "—"}</span>
                    <p className="text-xs text-gray-500">{e.customers?.phone || ""}</p>
                  </td>
                  <td className="py-2 pr-4 text-gray-600">{e.months} মাস</td>
                  <td className="py-2 pr-4 text-gray-800">{taka(e.monthly_bdt)}/মাস</td>
                  <td className="py-2 pr-4 text-gray-600">{e.start_date || "—"}</td>
                  <td className="py-2 text-right font-medium text-amber-600">{taka(e.total_bdt - e.monthly_bdt * e.paid_months)}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.status === "completed" ? "bg-green-100 text-green-700" : e.status === "defaulted" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                      {e.status === "completed" ? "সম্পন্ন" : e.status === "defaulted" ? "ডিফল্ট" : `${e.paid_months}/${e.months} মাস`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Memos */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <Icon name="FileText" size={18} />
          ক্রেডিট মেমো ({memoList.length})
        </h2>
        <div className="rounded-xl border border-gray-100 bg-white p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-4">তারিখ</th>
                <th className="py-2 pr-4">কাস্টমার</th>
                <th className="py-2 pr-4">পরিমাণ</th>
                <th className="py-2 pr-4">কারণ</th>
                <th className="py-2">ক্রেডিট সেল</th>
              </tr>
            </thead>
            <tbody>
              {memoList.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400">কোনো ক্রেডিট মেমো নেই</td>
                </tr>
              )}
              {memoList.map((m) => (
                <tr key={m.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 text-gray-600">{new Date(m.issued_at).toLocaleDateString("bn-BD")}</td>
                  <td className="py-2 pr-4">
                    <span className="font-medium">{m.customers?.name || "—"}</span>
                    <p className="text-xs text-gray-500">{m.customers?.phone || ""}</p>
                  </td>
                  <td className="py-2 pr-4 font-medium text-red-600">{taka(m.amount_bdt)}</td>
                  <td className="py-2 pr-4 text-gray-600">{m.reason || "—"}</td>
                  <td className="py-2 pr-4 text-gray-600">
                    {m.credit_sales ? (
                      <span>#{m.credit_sales.total_due} · {taka(m.credit_sales.total_due)}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <Icon name="HandCoins" size={18} />
          পেমেন্ট হিস্ট্রি ({paymentList.length})
        </h2>
        <div className="rounded-xl border border-gray-100 bg-white p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-4">তারিখ</th>
                <th className="py-2 pr-4">কাস্টমার</th>
                <th className="py-2 pr-4">পরিমাণ</th>
                <th className="py-2 pr-4">পদ্ধতি</th>
                <th className="py-2 pr-4">নোট</th>
                <th className="py-2">ক্রেডিট সেল</th>
              </tr>
            </thead>
            <tbody>
              {paymentList.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-400">কোনো পেমেন্ট নেই</td>
                </tr>
              )}
              {paymentList.map((p) => (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 text-gray-600">{new Date(p.payment_date).toLocaleDateString("bn-BD")}</td>
                  <td className="py-2 pr-4">
                    <span className="font-medium">{p.credit_sales?.customers?.name || "—"}</span>
                    <p className="text-xs text-gray-500">{p.credit_sales?.customers?.phone || ""}</p>
                  </td>
                  <td className="py-2 pr-4 font-medium text-emerald-600">{taka(p.amount_bdt)}</td>
                  <td className="py-2 pr-4 text-gray-600">{p.method || "ক্যাশ"}</td>
                  <td className="py-2 pr-4 text-gray-600">{p.note || "—"}</td>
                  <td className="py-2 pr-4 text-gray-600">
                    {p.credit_sales ? `#${p.credit_sales.id.slice(0, 8)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
