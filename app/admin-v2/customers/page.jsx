// app/admin-v2/customers/page.jsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

async function getCustomers() {
  const sb = await createClient();
  const { data: customers } = await sb
    .from("customers")
    .select("id, name, phone, type, created_at")
    .order("created_at", { ascending: false });
  return customers || [];
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">কাস্টমার ইঞ্জিন</h1>
          <p className="text-sm text-ink-muted">আপনার সকল কাস্টমার এবং তাদের ক্রেডিট হিস্ট্রি ম্যানেজ করুন।</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/admin-v2/sales/direct"
            className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gray-50 shadow-sm"
          >
            <Icon name="ShoppingCart" size={16} /> ডাইরেক্ট সেল
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-400">
            <tr>
              <th className="px-6 py-3 font-medium">নাম</th>
              <th className="px-6 py-3 font-medium">ফোন নম্বর</th>
              <th className="px-6 py-3 font-medium">ধরণ</th>
              <th className="px-6 py-3 font-medium text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-ink">{c.name || "—"}</td>
                <td className="px-6 py-4 text-ink-soft">{c.phone || "—"}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    c.type === 'credit' ? 'bg-amber-100 text-amber-700' : 
                    c.type === 'emi' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {c.type || 'walk-in'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/admin-v2/customers/${c.id}`}
                    className="text-xs font-medium text-brand hover:underline"
                  >
                    প্রোফাইল দেখুন
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <div className="p-10 text-center text-ink-muted">কোনো কাস্টমার পাওয়া যায়নি।</div>
        )}
      </div>
    </div>
  );
}
