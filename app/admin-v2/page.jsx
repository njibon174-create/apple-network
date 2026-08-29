// app/admin-v2/page.jsx
import { createClient } from "@/lib/supabase/server";
import Icon from "@/components/Icon";
import { taka } from "@/lib/data";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const sb = await createClient();
  
  // 1. Daily Revenue
  const today = new Date().toISOString().split('T')[0];
  const { data: cashData } = await sb
    .from("cash_transactions")
    .select("amount_bdt")
    .eq("type", "sale")
    .gte("created_at", today);
  const dailyRevenue = (cashData || []).reduce((sum, item) => sum + (item.amount_bdt || 0), 0);

  // 2. Total Credit Outstanding
  const { data: creditData } = await sb
    .from("customers")
    .select("credit_outstanding");
  const totalOutstanding = (creditData || []).reduce((sum, item) => sum + (item.credit_outstanding || 0), 0);

  // 3. Stock Alerts
  const { data: stockData } = await sb
    .from("stock_ledger")
    .select("qty")
    .lt("qty", 5);
  const lowStockCount = stockData?.length || 0;

  // 4. Pending Orders
  const { data: orderData } = await sb
    .from("orders")
    .select("id")
    .eq("status", "new");
  const pendingOrders = orderData?.length || 0;

  // 5. Recent Activity Logs (Actual Logs, not Ledger)
  const { data: activities } = await sb
    .from("customer_activity_log")
    .select("*, customers(name)")
    .order("created_at", { ascending: false })
    .limit(5);

  return { dailyRevenue, totalOutstanding, lowStockCount, pendingOrders, activities: activities || [] };
}

export default async function AdminV2Dashboard() {
  const data = await getDashboardData();

  const widgets = [
    { 
      label: \"আজকের রেভিনিউ\", 
      value: taka(data.dailyRevenue), 
      icon: \"TrendingUp\", 
      color: \"text-green-600\", 
      bg: \"bg-green-50\", 
      desc: \"Total Cash-in today\" 
    },
    { 
      label: \"মোট বাকি (Credit)\", 
      value: taka(data.totalOutstanding), 
      icon: \"AlertCircle\", 
      color: \"text-red-600\", 
      bg: \"bg-red-50\", 
      desc: \"Outstanding from customers\" 
    },
    { 
      label: \"স্টক সতর্কতা\", 
      value: `${data.lowStockCount}টি`, 
      icon: \"Package\", 
      color: \"text-amber-600\", 
      bg: \"bg-amber-50\", 
      desc: \"Items below 5 units\" 
    },
    { 
      label: \"পেন্ডিং অর্ডার\", 
      value: `${data.pendingOrders}টি\", 
      icon: \"Clock\", 
      color: \"text-brand\", 
      bg: \"bg-brand-light\", 
      desc: \"New orders to process\" 
    },
  ];

  return (
    <div className=\"space-y-8\">
      <div>
        <h1 className=\"text-2xl font-bold text-ink\">কন্ট্রোল সেন্টার</h1>
        <p className=\"text-sm text-ink-muted\">স্বাগতম! আপনার ব্যবসার বর্তমান অবস্থা এখানে দেখুন।</p>
      </div>

      <div className=\"grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4\">\n        {widgets.map((w, i) => (\n          <div key={i} className=\"rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md\">\n            <div className=\"flex items-center justify-between\">\n              <div className={`rounded-lg ${w.bg} p-2`}>\n                <Icon name={w.icon} size={20} className={w.color} />\n              </div>\n              <span className=\"text-[10px] font-bold uppercase tracking-wider text-gray-400\">Live</span>\n            </div>\n            <div className=\"mt-4\">\n              <p className=\"text-sm font-medium text-ink-soft\">{w.label}</p>\n              <h3 className={`text-2xl font-bold ${w.color}`}>{w.value}</h3>\n              <p className=\"mt-1 text-[11px] text-gray-400\">{w.desc}</p>\n            </div>\n          </div>\n        ))}\n      </div>\n\n      <div className=\"grid grid-cols-1 gap-6 lg:grid-cols-3\">\n        <div className=\"lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm\">\n          <div className=\"mb-4 flex items-center justify-between\">\n            <h2 className=\"text-lg font-bold text-ink\">সাম্প্রতিক অ্যাক্টিভিটি</h2>\n            <Link href=\"/admin-v2/customers\" className=\"text-xs font-medium text-brand hover:underline\">সব দেখুন</Link>\n          </div>\n          <div className=\"space-y-4\">\n            {data.activities.map((act, i) => (\n              <div key={i} className=\"flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100\">\n                <div className=\"flex items-center gap-3\">\n                  <div className=\"h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center text-brand\">\n                    <Icon name=\"Activity\" size={14} />\n                  </div>\n                  <div>\n                    <p className=\"text-sm font-medium text-ink\">{act.summary}</p>\n                    <p className=\"text-[11px] text-gray-400\">{act.customers?.name || 'System'} · {new Date(act.created_at).toLocaleString(\"bn-BD\")}</p>\n                  </div>\n                </div>\n                <div className=\"text-xs text-gray-400\">{act.detail ? 'বিস্তারিত আছে' : ''}</div>\n              </div>\n            ))}\n            {data.activities.length === 0 && (\n              <div className=\"p-10 text-center text-gray-400 text-sm italic\">কোনো সাম্প্রতিক অ্যাক্টিভিটি পাওয়া যায়নি।</div>\n            )}\n          </div>\n        </div>\n\n        <div className=\"rounded-2xl border border-gray-100 bg-white p-6 shadow-sm\">\n          <h2 className=\"mb-4 text-lg font-bold text-ink\">কুইক অ্যাকশন</h2>\n          <div className=\"grid grid-cols-1 gap-3\">\n            <Link href=\"/admin-v2/inventory/new\" className=\"flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm font-medium text-ink transition hover:bg-brand-light hover:text-brand group\">\n              <Icon name=\"PlusCircle\" size={18} className=\"text-gray-400 group-hover:text-brand\" />\n              নতুন প্রোডাক্ট যোগ করুন\n            </Link>\n            <Link href=\"/admin-v2/customers/new\" className=\"flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm font-medium text-ink transition hover:bg-brand-light hover:text-brand group\">\n              <Icon name=\"Users\" size={18} className=\"text-gray-400 group-hover:text-brand\" />\n              নতুন কাস্টমার তৈরি করুন\n            </Link>\n            <Link href=\"/admin-v2/sales/direct\" className=\"flex items-center gap-3 rounded-xl bg-brand p-3 text-sm font-medium text-white transition hover:bg-brand-600 group\">\n              <Icon name=\"ShoppingCart\" size={18} />\n              সরাসরি বিক্রয় (Quick Sell)\n            </Link>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}
