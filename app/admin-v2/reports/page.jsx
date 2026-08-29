// app/admin-v2/reports/page.jsx
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

async function getReportData() {
  const sb = await createClient();

  // 1. Total Sales Revenue (Sum of all orders + direct sales)
  const { data: orders } = await sb.from("orders").select("total_bdt");
  const totalOrderRevenue = (orders || []).reduce((sum, o) => sum + (o.total_bdt || 0), 0);
  
  const { data: cashBook } = await sb.from("cash_book").select("amount").eq("type", "income");
  const totalCashIncome = (cashBook || []).reduce((sum, i) => sum + (i.amount || 0), 0);

  // 2. Total Expenses
  const { data: expenses } = await sb.from("cash_book").select("amount").eq("type", "expense");
  const totalExpenses = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);

  // 3. Total Credit Outstanding
  const { data: customers } = await sb.from("customers").select("credit_outstanding");
  const totalCredit = (customers || []).reduce((sum, c) => sum + (c.credit_outstanding || 0), 0);

  // 4. Product Performance (Top 5 by sales count)
  // This usually requires a join or aggregation on stock_ledger/orders
  const { data: stockLogs } = await sb.from("stock_ledger").select("product_id, qty").lt("qty", 0); 
  // Note: In this schema, negative qty in stock_ledger often represents sales.
  
  return {
    revenue: totalOrderRevenue + totalCashIncome,
    expenses: totalExpenses,
    profit: (totalOrderRevenue + totalCashIncome) - totalExpenses,
    credit: totalCredit,
  };
}

export default async function ReportsPage() {
  const data = await getReportData();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">বিজনেস রিপোর্ট সেন্টার</h1>
          <p className="text-sm text-ink-muted">আপনার ব্যবসার লাভ-ক্ষতি এবং আর্থিক অবস্থা বিশ্লেষণ করুন।</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gray-50 shadow-sm">
          <Icon name="Download" size={16} /> রিপোর্ট ডাউনলোড
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <Icon name="TrendingUp" size={20} />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">মোট রেভিনিউ</span>
          </div>
          <p className="text-2xl font-bold text-ink">{taka(data.revenue)}</p>
          <p className="text-[10px] text-green-600 font-medium mt-1">↑ মোট আয় (Cash + Orders)</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <Icon name="TrendingDown" size={20} />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">মোট খরচ</span>
          </div>
          <p className="text-2xl font-bold text-ink">{taka(data.expenses)}</p>
          <p className="text-[10px] text-red-600 font-medium mt-1">↓ মোট ব্যয়</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Icon name="DollarSign" size={20} />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">নিট প্রফিট</span>
          </div>
          <p className="text-2xl font-bold text-ink">{taka(data.profit)}</p>
          <p className="text-[10px] text-blue-600 font-medium mt-1">আয় - ব্যয়</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Icon name="AlertCircle" size={20} />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">মোট বকেয়া</span>
          </div>
          <p className="text-2xl font-bold text-ink">{taka(data.credit)}</p>
          <p className="text-[10px] text-amber-600 font-medium mt-1">কাস্টমারদের মোট বাকি</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Insight Section */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-ink mb-6">বিজনেস ইনসাইট</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="p-2 rounded-full bg-white shadow-sm">
                <Icon name="Lightbulb" size={16} className="text-brand" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">প্রফিট মার্জিন বিশ্লেষণ</p>
                <p className="text-xs text-gray-500 mt-1">
                  আপনার বর্তমান প্রফিট মার্জিন {data.revenue > 0 ? ((data.profit / data.revenue) * 100).toFixed(1) : 0}%। 
                  এটি আপনার ব্যবসার স্থায়িত্ব নির্দেশ করে।
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="p-2 rounded-full bg-white shadow-sm">
                <Icon name="AlertTriangle" size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">বকেয়া সতর্কতা</p>
                <p className="text-xs text-gray-500 mt-1">
                  মোট বকেয়া {taka(data.credit)}। বকেয়া কমানোর জন্য কাস্টমারদের সাথে যোগাযোগ করুন।
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder for future charts */}
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-3 rounded-full bg-white shadow-sm text-gray-300">
            <Icon name="BarChart" size={32} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400">গ্রাফিক্যাল রিপোর্ট আসছে</p>
            <p className="text-xs text-gray-400">বিস্তারিত সেলস চার্ট এবং গ্রাফ শীঘ্রই যোগ করা হবে।</p>
          </div>
        </div>
      </div>
    </div>
  );
}
