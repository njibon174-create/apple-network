// app/admin-v2/returns/page.jsx
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getReturns() {
  const sb = await createClient();
  const { data: returns } = await sb
    .from("returns")
    .select(`
      *,
      customers (name, phone)
    `)
    .order("created_at", { ascending: false });
  return returns || [];
}

export default async function ReturnsPage() {
  const returns = await getReturns();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">রিটার্ন ম্যানেজমেন্ট</h1>
          <p className="text-sm text-ink-muted">পণ্য ফেরত গ্রহণ এবং স্টক আপডেট ম্যানেজ করুন।</p>
        </div>
        <Link 
          href="/admin-v2/returns/new" 
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <Icon name="ArrowLeft" size={16} /> নতুন রিটার্ন
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-400">
            <tr>
              <th className="px-6 py-3 font-medium">তারিখ</th>
              <th className="px-6 py-3 font-medium">কাস্টমার</th>
              <th className="px-6 py-3 font-medium">প্রোডাক্ট</th>
              <th className="px-6 py-3 font-medium">স্ট্যাটাস</th>
              <th className="px-6 py-3 font-medium text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {returns.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-ink-soft">
                  {new Date(r.created_at).toLocaleDateString("bn-BD")}
                </td>
                <td className="px-6 py-4 font-medium text-ink">
                  {r.customers?.name || "—"}
                </td>
                <td className="px-6 py-4 text-ink-soft">
                  {r.product_name || "—"}
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    r.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/admin-v2/returns/${r.id}`}
                    className="text-xs font-medium text-brand hover:underline"
                  >
                    ডিটেইলস
                  </Link>
                </td>
              </tr>
            ))}
            {returns.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-ink-muted italic">কোনো রিটার্ন পাওয়া যায়নি।</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
