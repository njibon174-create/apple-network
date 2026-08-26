// app/admin/expenses/page.jsx — Expenses ledger.
// Owner-only via RLS on expenses (is_owner()).
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";
import ExpenseForm, { ExpenseRow } from "./ExpenseForm";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const sb = await createClient();
  const { data } = await sb
    .from("expenses")
    .select("*")
    .order("created_at", { ascending: false });
  const rows = data || [];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthTotal = rows
    .filter((r) => r.created_at >= monthStart)
    .reduce((s, r) => s + r.amount_bdt, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Icon name="Receipt" size={22} className="text-emerald-600" />
        <h1 className="text-xl font-semibold text-gray-800">খরচ</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-sm text-gray-500">এই মাসের মোট খরচ</p>
          <p className="text-2xl font-bold text-red-600">{taka(monthTotal)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 flex items-center justify-center">
          <ExpenseForm />
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="py-2 pr-4">তারিখ</th>
              <th className="py-2 pr-4">ক্যাটাগরি</th>
              <th className="py-2 pr-4">নোট</th>
              <th className="py-2 pr-4 text-right">পরিমাণ</th>
              <th className="py-2 text-right">—</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-400">
                  কোনো খরচ নেই
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <ExpenseRow key={r.id} row={r} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
