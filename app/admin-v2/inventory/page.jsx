// app/admin-v2/inventory/page.jsx
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getInventory() {
  const sb = await createClient();
  const { data: products, error } = await sb.from("products").select("*, stock_ledger(qty)");
  
  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  // In this schema, stock is usually the sum of qty in stock_ledger for that product
  const processed = (products || []).map(p => {
    const totalStock = (p.stock_ledger || []).reduce((sum, entry) => sum + (entry.qty || 0), 0);
    return { ...p, current_stock: totalStock };
  });

  return processed;
}

export default async function InventoryPage() {
  const inventory = await getInventory();

  const status = (qty) => {
    if (qty <= 5) return { label: "Critical", color: "bg-red-100 text-red-700" };
    if (qty <= 15) return { label: "Low", color: "bg-amber-100 text-amber-700" };
    return { label: "Healthy", color: "bg-green-100 text-green-700" };
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">ইনভেন্টরি কন্ট্রোলার</h1>
          <p className="text-sm text-ink-muted">স্টক লেভেল মনিটর করুন এবং প্রোডাক্ট ম্যানেজ করুন।</p>
        </div>
        <Link 
          href="/admin-v2/inventory/new" 
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <Icon name="Plus" size={16} /> নতুন প্রোডাক্ট
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-400">
            <tr>
              <th className="px-6 py-3 font-medium">প্রোডাক্ট</th>
              <th className="px-6 py-3 font-medium text-center">স্টক অবস্থা</th>
              <th className="px-6 py-3 font-medium text-right">মূল্য</th>
              <th className="px-6 py-3 font-medium text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inventory.map((p) => {
              const s = status(p.current_stock);
              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-ink">{p.name}</div>
                    <div className="text-[10px] text-gray-400">{p.name_bn}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${s.color}`}>
                      {p.current_stock} {s.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-ink">{taka(p.price_bdt)}</td>
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
        {inventory.length === 0 && (
          <div className="p-10 text-center text-ink-muted">কোনো প্রোডাক্ট পাওয়া যায়নি।</div>
        )}
      </div>
    </div>
  );
}
