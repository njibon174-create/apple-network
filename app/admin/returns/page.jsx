// app/admin/returns/page.jsx — Returns Management with full lifecycle.
// Owner-only via RLS on returns (is_owner()).
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";
import ReturnForm from "./ReturnForm";
import ReturnCard from "./ReturnCard";

const STATUS_LABEL = {
  pending: "অপেক্ষায়",
  approved: "অনুমোদিত",
  rejected: "প্রত্যাখ্যান",
  refunded: "রিফান্ড করা হয়েছে",
};
const STATUS_COLOR = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  refunded: "bg-emerald-100 text-emerald-700",
};
const COND_LABEL = {
  new: "নতুন",
  like_new: "অত্যন্ত ভালো",
  good: "ভালো",
  damaged: "ক্ষতিগ্রস্ত",
};

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const sb = await createClient();
  const { data } = await sb
    .from("returns")
    .select(
      "id, order_id, order_number, product_name, product_id, reason, condition, qty, refund_bdt, restock, status, returned_at, processed_by, created_at, customers(name, phone), products(name)"
    )
    .order("created_at", { ascending: false });

  const rows = data || [];

  // Group by status.
  const byStatus = { pending: [], approved: [], rejected: [], refunded: [] };
  for (const r of rows) {
    byStatus[r.status] = byStatus[r.status] || [];
    byStatus[r.status].push(r);
  }

  // Counts.
  const counts = {
    total: rows.length,
    pending: (byStatus.pending || []).length,
    approved: (byStatus.approved || []).length,
    rejected: (byStatus.rejected || []).length,
    refunded: (byStatus.refunded || []).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Icon name="Undo2" size={22} className="text-emerald-600" />
        <h1 className="text-xl font-semibold text-gray-800">রিটার্ন ম্যানেজমেন্ট</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-xs text-gray-500">মোট রিটার্ন</p>
          <p className="text-xl font-bold text-gray-800">{counts.total}</p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-white p-4">
          <p className="text-xs text-gray-500">অপেক্ষায়</p>
          <p className="text-xl font-bold text-yellow-600">{counts.pending}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-white p-4">
          <p className="text-xs text-gray-500">অনুমোদিত</p>
          <p className="text-xl font-bold text-blue-600">{counts.approved}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-white p-4">
          <p className="text-xs text-gray-500">রিফান্ড করা হয়েছে</p>
          <p className="text-xl font-bold text-emerald-600">{counts.refunded}</p>
        </div>
      </div>

      {/* Pending returns — action required */}
      {byStatus.pending?.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Icon name="Clock" size={18} className="text-yellow-600" />
            অপেক্ষায় রিটার্ন ({byStatus.pending.length})
          </h2>
          <div className="space-y-3">
            {byStatus.pending.map((r) => (
              <ReturnCard key={r.id} ret={r} />
            ))}
          </div>
        </div>
      )}

      {/* Approved — pending processing */}
      {byStatus.approved?.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Icon name="CheckCircle" size={18} className="text-blue-600" />
            অনুমোদিত রিটার্ন ({byStatus.approved.length})
          </h2>
          <div className="space-y-3">
            {byStatus.approved.map((r) => (
              <ReturnCard key={r.id} ret={r} />
            ))}
          </div>
        </div>
      )}

      {/* All returns table */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="py-2 pr-4">তারিখ</th>
              <th className="py-2 pr-4">অর্ডার</th>
              <th className="py-2 pr-4">পণ্য</th>
              <th className="py-2 pr-4">কন্ডিশন</th>
              <th className="py-2 pr-4">কারণ</th>
              <th className="py-2 pr-4">পরিমাণ</th>
              <th className="py-2 pr-4">স্টক</th>
              <th className="py-2 text-right">রিফান্ড</th>
              <th className="py-2 pr-4">স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-gray-400">
                  কোনো রিটার্ন নেই
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-gray-50">
                <td className="py-2 pr-4 text-gray-600">
                  {new Date(r.created_at).toLocaleString("bn-BD")}
                </td>
                <td className="py-2 pr-4 text-gray-600">{r.order_number || "—"}</td>
                <td className="py-2 pr-4 font-medium">{r.product_name}</td>
                <td className="py-2 pr-4 text-gray-600">{COND_LABEL[r.condition] || "—"}</td>
                <td className="py-2 pr-4 text-gray-600">{r.reason || "—"}</td>
                <td className="py-2 pr-4">×{r.qty}</td>
                <td className="py-2 pr-4">
                  {r.restock ? (
                    <span className="text-emerald-600">হ্যাঁ</span>
                  ) : (
                    <span className="text-gray-400">না</span>
                  )}
                </td>
                <td className="py-2 text-right font-medium text-red-600">
                  {r.refund_bdt > 0 ? taka(r.refund_bdt) : "—"}
                </td>
                <td className="py-2 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[r.status]}`}>
                    {STATUS_LABEL[r.status] || r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Return form */}
      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <ReturnForm />
      </div>
    </div>
  );
}
