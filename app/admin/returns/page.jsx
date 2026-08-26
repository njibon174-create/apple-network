// app/admin/returns/page.jsx — Product returns (refund + optional restock).
// Owner-only via RLS on returns (is_owner()).
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";
import ReturnForm from "./ReturnForm";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const sb = await createClient();
  const { data } = await sb
    .from("returns")
    .select("*")
    .order("created_at", { ascending: false });
  const rows = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Icon name="Undo2" size={22} className="text-emerald-600" />
        <h1 className="text-xl font-semibold text-gray-800">রিটার্ন</h1>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <ReturnForm />
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="py-2 pr-4">তারিখ</th>
              <th className="py-2 pr-4">অর্ডার</th>
              <th className="py-2 pr-4">পণ্য</th>
              <th className="py-2 pr-4">কারণ</th>
              <th className="py-2 pr-4">স্টক</th>
              <th className="py-2 text-right">রিফান্ড</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-400">
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
                <td className="py-2 pr-4">{r.product_name}</td>
                <td className="py-2 pr-4 text-gray-600">{r.reason || "—"}</td>
                <td className="py-2 pr-4">
                  {r.restock ? (
                    <span className="text-emerald-600">স্টকে ফেরত</span>
                  ) : (
                    <span className="text-gray-400">না</span>
                  )}
                </td>
                <td className="py-2 text-right font-medium text-red-600">
                  {r.refund_bdt > 0 ? taka(r.refund_bdt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
