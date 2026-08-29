// app/admin-v2/page.jsx
import { createClient } from "@/lib/supabase/server";
import Icon from "@/components/Icon";
import { taka } from "@/lib/data";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getKPIs() {
  const sb = await createClient();
  
  // 1. Daily Revenue (Cash Book)
  const today = new Date().toISOString().split('T')[0];
  const { data: cashData } = await sb
    .from("cash_book")
    .select("amount")
    .eq("type", "income")
    .gte("created_at", today);
  const dailyRevenue = (cashData || []).reduce((sum, item) => sum + (item.amount || 0), 0);

  // 2. Total Credit Outstanding
  const { data: creditData } = await sb
    .from("credit_sales")
    .select("total_due, amount_paid");
  const totalOutstanding = (creditData || []).reduce((sum, item) => sum + (item.total_due || 0) - (item.amount_paid || 0), 0);

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

  return { dailyRevenue, totalOutstanding, lowStockCount, pendingOrders };
}

export default async function AdminV2Dashboard() {
  const kpis = await getKPIs();

  const widgets = [
    { 
      label: "আজকের রেভিনিউ", 
      value: taka(kpis.dailyRevenue), 
      icon: "TrendingUp", 
      color: "text-green-600", 
      bg: "bg-green-50", 
      desc: "Total Cash-in today" 
    },
    { 
      label: "মোট বাকি (Credit)", 
      value: taka(kpis.totalOutstanding), 
      icon: "AlertCircle", 
      color: "text-red-600", 
      bg: "bg-red-50", 
      desc: "Outstanding from customers" 
    },
    { 
      label: "স্টক সতর্কতা", 
      value: `${kpis.lowStockCount}টি`, 
      icon: "Package", 
      color: "text-amber-600", 
      bg: "bg-amber-50", 
      desc: "Items below 5 units" 
    },
    { 
      label: "পেন্ডিং অর্ডার", 
      value: `${kpis.pendingOrders}টি`, 
      icon: "Clock", 
      color: "text-brand", 
      bg: "bg-brand-light", 
      desc: "New orders to process" 
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">কন্ট্রোল সেন্টার</h1>
        <p className="text-sm text-ink-muted">স্বাগতম! আপনার ব্যবসার বর্তমান অবস্থা এখানে দেখুন।</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {widgets.map((w, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className={`rounded-lg ${w.bg} p-2`}>
                <Icon name={w.icon} size={20} className={w.color} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Live</span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-ink-soft">{w.label}</p>
              <h3 className={`text-2xl font-bold ${w.color}`}>{w.value}</h3>
              <p className="mt-1 text-[11px] text-gray-400">{w.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">সাম্প্রতিক অ্যাক্টিভিটি</h2>
            <Link href="/admin-v2/finance/all-transactions" className="text-xs font-medium text-brand hover:underline">সব দেখুন</Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                  <Icon name="ArrowUpRight" size={14} />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">নতুন ক্যাশ সেল রেকর্ড করা হয়েছে</p>
                  <p className="text-[11px] text-gray-400">২ মিনিট আগে</p>
                </div>
              </div>
              <span className="text-sm font-bold text-green-600">+৳১২,০০০</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <Icon name="AlertTriangle" size={14} />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">iPhone 15 Pro স্টক শেষ</p>
                  <p className="text-[11px] text-gray-400">১ ঘণ্টা আগে</p>
                </div>
              </div>
              <button className="text-xs font-medium text-brand hover:underline">স্টক আপডেট</button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-ink">কুইক অ্যাকশন</h2>
          <div className="grid grid-cols-1 gap-3">
            <button className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm font-medium text-ink transition hover:bg-brand-light hover:text-brand group">
              <Icon name="PlusCircle" size={18} className="text-gray-400 group-hover:text-brand" />
              নতুন প্রোডাক্ট যোগ করুন
            </button>
            <button className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm font-medium text-ink transition hover:bg-brand-light hover:text-brand group">
              <Icon name="Users" size={18} className="text-gray-400 group-hover:text-brand" />
              নতুন কাস্টমার তৈরি করুন
            </button>
            <button className="flex items-center gap-3 rounded-xl border border-gray-100 bg-brand p-3 text-sm font-medium text-white transition hover:bg-brand-600 group">
              <Icon name="ShoppingCart" size={18} />
              সরাসরি বিক্রয় (Quick Sell)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
