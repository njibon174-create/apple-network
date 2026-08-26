// app/admin/cash/page.jsx — Cash Book with running balance.
// Owner-only via RLS on cash_transactions (is_owner()).
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";
import CashForm from "./CashForm";

const TYPE_LABEL = {
  sale: "বিক্রয়",
  expense: "খরচ",
  capital_in: "মূলধন প্রবেশ",
  capital_out: "মূলধন বাহির",
  refund: "রিফান্ড",
};

const INFLOW = new Set(["sale", "capital_in"]);

export const dynamic = "force-dynamic";

export default async function CashPage() {
  const sb = await createClient();
  const { data } = await sb
    .from("cash_transactions")
    .select("*")
    .order("created_at", { ascending: false });
  const rows = data || [];

  // Running balance: inflows add, outflows subtract. rows share object refs
  // with `asc`, so writing `balance` here is reflected in `rows`.
  const asc = [...rows].reverse(); // oldest first
  let run = 0;
  for (const r of asc) {
    run += INFLOW.has(r.type) ? r.amount_bdt : -r.amount_bdt;
    r.balance = run;
  }
  const cashInHand = asc.length ? run : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Icon name="Wallet" size={22} className="text-emerald-600" />
        <h1 className="text-xl font-semibold text-gray-800">ক্যাশ বুক</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-sm text-gray-500">হাতে থাকা নগদ</p>
          <p className={`text-2xl font-bold ${cashInHand >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {taka(cashInHand)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 flex items-center justify-center">
          <CashForm />
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="py-2 pr-4">তারিখ</th>
              <th className="py-2 pr-4">ধরন</th>
              <th className="py-2 pr-4">রেফারেন্স</th>
              <th className="py-2 pr-4">নোট</th>
              <th className="py-2 pr-4 text-right">পরিমাণ</th>
              <th className="py-2 text-right">ব্যালেন্স</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-400">
                  কোনো লেনদেন নেই
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const isIn = INFLOW.has(r.type);
              return (
                <tr key={r.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 text-gray-600">
                    {new Date(r.created_at).toLocaleString("bn-BD")}
                  </td>
                  <td className="py-2 pr-4">{TYPE_LABEL[r.type] || r.type}</td>
                  <td className="py-2 pr-4 text-gray-600">{r.ref || "—"}</td>
                  <td className="py-2 pr-4 text-gray-600">{r.note || "—"}</td>
                  <td className={`py-2 pr-4 text-right font-medium ${isIn ? "text-emerald-600" : "text-red-600"}`}>
                    {isIn ? "+" : "−"}
                    {taka(r.amount_bdt)}
                  </td>
                  <td className="py-2 text-right font-medium text-gray-800">
                    {taka(r.balance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
