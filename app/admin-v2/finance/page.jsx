// app/admin-v2/finance/page.jsx
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

async function getFinanceData() {
  const sb = await createClient();

  // 1. Total Cash (Sum of all income - expenses)
  const { data: cashTransactions } = await sb
    .from("cash_book")
    .select("amount, type");
  
  let totalCash = 0;
  (cashTransactions || []).forEach(t => {
    if (t.type === "income") totalCash += t.amount;
    else if (t.type === "expense") totalCash -= t.amount;
  });

  // 2. Total Credit Outstanding
  const { data: creditData } = await sb
    .from("credit_sales")
    .select("total_due, amount_paid");
  
  let totalCredit = 0;
  (creditData || []).forEach(c => {
    totalCredit += (c.total_due || 0) - (c.amount_paid || 0);
  });

  // 3. Recent Transactions
  const { data: recentLogsData } = await sb
    .from("cash_book")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);
  const recentLogs = recentLogsData || [];

  return { totalCash, totalCredit, recentLogs };
}

export default async function FinanceHub() {
  const { totalCash, totalCredit, recentLogs } = await getFinanceData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">ফিন্যান্স হাব</h1>
        <p className="text-sm text-ink-muted">নগদ টাকা, ক্রেডিট এবং খরচের সমন্বিত হিসাব।</p>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-green-600 mb-2">
            <Icon name="Wallet" size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">মোট নগদ (Cash in Hand)</span>
          </div>
          <h3 className="text-3xl font-bold text-ink">{taka(totalCash)}</h3>
          <p className="mt-1 text-[11px] text-gray-400">সকল ইনকাম এবং খরচ বাদ দিয়ে</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <Icon name="AlertCircle" size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">মোট বাকি (Credit Due)</span>
          </div>
          <h3 className="text-3xl font-bold text-ink">{taka(totalCredit)}</h3>
          <p className="mt-1 text-[11px] text-gray-400">কাস্টমারদের কাছে মোট পাওনা</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-brand mb-2">
            <Icon name="TrendingUp" size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">মাসিক প্রফিট (Est.)</span>
          </div>
          <h3 className="text-3xl font-bold text-ink">{taka(totalCash * 0.2)}</h3>
          <p className="mt-1 text-[11px] text-gray-400">আনুমানিক ২০% প্রফিট মার্জিন</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Transaction Ledger */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <h2 className="text-lg font-bold text-ink">লেনদেন লেজার</h2>
            <button className="text-xs font-medium text-brand hover:underline">সব দেখুন</button>
          </div>
          <div className="overflow-x-auto">
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
                {recentLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-ink-soft">
                      {new Date(log.created_at).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="px-6 py-4 font-medium text-ink">
                      {log.description || "কোনো বিবরণ নেই"}
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
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Finance Actions */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-ink">কুইক ফিন্যান্স</h2>
            <div className="grid grid-cols-1 gap-3">
              <button className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm font-medium text-ink transition hover:bg-brand-light hover:text-brand group">
                <Icon name="PlusCircle" size={18} className="text-gray-400 group-hover:text-brand" />
                নতুন ইনকাম যোগ করুন
              </button>
              <button className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm font-medium text-ink transition hover:bg-brand-light hover:text-brand group">
                <Icon name="MinusCircle" size={18} className="text-gray-400 group-hover:text-brand" />
                খরচ রেকর্ড করুন
              </button>
              <button className="flex items-center gap-3 rounded-xl border border-gray-100 bg-brand p-3 text-sm font-medium text-white transition hover:bg-brand-600 group">
                <Icon name="ArrowDownLeft" size={18} />
                ক্রেডিট পেমেন্ট রিসিভ
              </button>
            </div>
          </div>
          
          <div className="rounded-2xl border border-gray-100 bg-brand-light p-6 shadow-sm">
            <h3 className="text-sm font-bold text-brand mb-2">ফিন্যান্স টিপস</h3>
            <p className="text-xs text-brand-700 leading-relaxed">
              আপনার মোট ক্রেডিট আউটস্ট্যান্ডিং অনেক বেশি। কাস্টমারদের রিমাইন্ডার পাঠিয়ে পেমেন্ট সংগ্রহ করার চেষ্টা করুন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
