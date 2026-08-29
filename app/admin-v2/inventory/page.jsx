// app/admin-v2/inventory/page.jsx
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getInventoryStats() {
  const sb = await createClient();

  // 1. Stock Health
  const { data: stock } = await sb.from("stock_ledger").select("qty");
  const stockCounts = {
    critical: 0, // < 3
    low: 0,      // 3-10
    healthy: 0,  // > 10
  };

  (stock || []).forEach(item => {
    if (item.qty <= 0) stockCounts.critical++;
    else if (item.qty < 5) stockCounts.critical++;
    else if (item.qty < 15) stockCounts.low++;
    else stockCounts.healthy++;
  });

  // 2. Product List for the "Health Monitor"
  const { data: products } = await sb
    .from("products")
    .select("id, name, price_bdt, in_stock")
    .order("name");

  // Join with stock
  const productStock = await sb.from("stock_ledger").select("product_id, qty");
  const stockMap = Object.fromEntries((productStock.data || []).map(s => [s.product_id, s.qty]));

  const inventory = (products || []).map(p => ({
    ...p,
    qty: stockMap[p.id] || 0
  })).sort((a, b) => a.qty - b.qty);

  return { stockCounts, inventory };
}

export default async function InventoryController() {
  const { stockCounts, inventory } = await getInventoryStats();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">ইনভেন্টরি কন্ট্রোলার</h1>
          <p className="text-sm text-ink-muted">স্টক মনিটর করুন এবং প্রোডাক্ট ম্যানেজ করুন।</p>
        </div>
        <Link 
          href="/admin-v2/inventory/new" 
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <Icon name="Plus" size={16} /> নতুন প্রোডাক্ট
        </Link>
      </div>

      {/* Stock Health Monitor */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <Icon name="AlertTriangle" size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Critical Stock</span>
          </div>
          <h3 className="text-3xl font-bold text-ink">{stockCounts.critical}টি</h3>
          <p className="mt-1 text-[11px] text-red-500">তত্ক্ষণাৎ অর্ডার করা প্রয়োজন</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6">
          <div className="flex items-center gap-3 text-amber-600 mb-2">
            <Icon name="Clock" size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock</span>
          </div>
          <h3 className="text-3xl font-bold text-ink">{stockCounts.low}টি</h3>
          <p className="mt-1 text-[11px] text-amber-600">শীঘ্রই শেষ হয়ে যাবে</p>
        </div>
        <div className="rounded-2xl border border-green-100 bg-green-50 p-6">
          <div className="flex items-center gap-3 text-green-600 mb-2">
            <Icon name="CheckCircle" size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Healthy Stock</span>
          </div>
          <h3 className="text-3xl font-bold text-ink">{stockCounts.healthy}টি</h3>
          <p className="mt-1 text-[11px] text-green-600">পর্যাপ্ত স্টক আছে</p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <h2 className="text-lg font-bold text-ink">স্টক মনিটর</h2>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Critical
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Low
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-400">
              <tr>
                <th className="px-6 py-3 font-medium">প্রোডাক্ট</th>
                <th className="px-6 py-3 font-medium">দাম</th>
                <th className="px-6 py-3 font-medium text-center">স্টক পরিমাণ</th>
                <th className="px-6 py-3 font-medium text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventory.map((p) => {
                const statusColor = p.qty <= 0 ? "text-red-600" : p.qty < 5 ? "text-red-600 font-bold" : p.qty < 15 ? "text-amber-600" : "text-ink-soft";
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-ink">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.id}</p>
                    </td>
                    <td className="px-6 py-4 text-ink-soft">{taka(p.price_bdt)}</td>
                    <td className={`px-6 py-4 text-center font-bold ${statusColor}`}>
                      {p.qty}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin-v2/inventory/edit/${p.id}`}
                        className="text-xs font-medium text-brand hover:underline"
                      >
                        এডিট
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
