// app/admin-v2/activity-logs/page.jsx
import { createClient } from "@/lib/supabase/server";
import Icon from "@/components/Icon";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getActivityLogs() {
  const sb = await createClient();
  const { data: activities } = await sb
    .from("customer_activity_log")
    .select("*, customers(name, phone)")
    .order("created_at", { ascending: false });
  return activities || [];
}

export default async function ActivityLogsPage() {
  const logs = await getActivityLogs();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin-v2" className="p-2 rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-brand transition-colors">
            <Icon name="ArrowLeft" size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink">সিস্টেম অ্যাক্টিভিটি লগ</h1>
            <p className="text-sm text-ink-muted">কাস্টমার এবং সিস্টেমের সকল কার্যক্রমের বিস্তারিত তালিকা।</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-400">
            <tr>
              <th className="px-6 py-3 font-medium">তারিখ</th>
              <th className="px-6 py-3 font-medium">কাস্টমার</th>
              <th className="px-6 py-3 font-medium">অ্যাক্টিভিটি</th>
              <th className="px-6 py-3 font-medium">বিস্তারিত</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-ink-soft whitespace-nowrap">
                  {log.created_at ? new Date(log.created_at).toLocaleString("bn-BD") : "—"}
                </td>
                <td className="px-6 py-4 font-medium text-ink">
                  {log.customers?.name || "System"} 
                  {log.customers?.phone && <span className="block text-[10px] text-gray-400">{log.customers.phone}</span>}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-ink">{log.summary}</span>
                </td>
                <td className="px-6 py-4 text-ink-soft">
                  {log.detail || "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-ink-muted italic">কোনো অ্যাক্টিভিটি লগ পাওয়া যায়নি।</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
