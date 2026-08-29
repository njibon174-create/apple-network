// app/admin-v2/finance/all-transactions/page.jsx
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getFullLedger() {
  const sb = await createClient();
  const { data: txns } = await sb
    .from("cash_transactions")
    .select("*")
    .order("created_at", { ascending: false });
  
  return (txns || []).map(log => ({
    ...log,
    amount: log.amount_bdt,
    description: log.note || log.ref || "No description",
    type: ["sale", "capital_in"].includes(log.type) ? "income" : "expense"
  }));
}

export default async function AllTransactionsPage() {
  const ledger = await getFullLedger();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin-v2/finance" className="p-2 rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-brand transition-colors">
            <Icon name="ArrowLeft" size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink">সম্পূর্ণ লেনদেন লেজার</h1>
            <p className="text-sm text-ink-muted">ব্যবসার সকল আর্থিক লেনদেনের বিস্তারিত তালিকা।</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-400">
            <tr>
              <th className="px-6 py-3 font-medium">তারিখ</th>
              <th className="px-6 py-3 font-medium">বিবরণ</th>
              <th className="px-6 py-3 font-medium">ধরণ</th>
              <th className="px-6 py-3 font-medium text-right">পরিমাণ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ledger.map((log, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-ink-soft">
                  {log.created_at ? new Date(log.created_at).toLocaleDateString("bn-BD") : "—"}
                </td>
                <td className="px-6 py-4 font-medium text-ink">
                  {log.description}
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${log.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {log.type === 'income' ? 'ইনকাম' : 'খরচ'}
                  </span>
                </td>
                <td className={`px-6 py-4 text-right font-bold ${log.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {log.type === 'income' ? '+' : '-'} {taka(log.amount)}
                </td>
              </tr>
            ))}
            {ledger.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-400 italic">কোনো লেনদেন পাওয়া যায়নি।</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
