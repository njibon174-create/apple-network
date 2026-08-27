// app/admin/cash/page.jsx — Cash Book: unified cash ledger with running balance,
// channel breakdown, type summary. Owner-only via RLS (is_owner()).
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";
import CashForm from "./CashForm";

const TYPE_LABEL = {
  sale: "বিক্রয়",
  expense: "খরচ",
  capital_in: "মূলধন প্রবেশ",
  capital_out: "মূলধন বাহির",
  refund: "রিফান্ড",
};

const TYPE_COLOR = {
  sale: "text-emerald-600",
  expense: "text-red-600",
  capital_in: "text-blue-600",
  capital_out: "text-red-600",
  refund: "text-orange-600",
};

const CHANNEL_LABEL = {
  online: "অনলাইন",
  pos: "POS",
  credit: "ক্রেডিট",
  emi: "EMI",
  capital: "মূলধন",
  refund: "রিফান্ড",
  expense: "খরচ",
  other: "অন্যান্য",
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

  // Running balance: oldest first.
  const asc = [...rows].reverse();
  let run = 0;
  for (const r of asc) {
    run += INFLOW.has(r.type) ? r.amount_bdt : -r.amount_bdt;
    r.balance = run;
  }
  const cashInHand = asc.length ? run : 0;

  // Type summary.
  const byType = {};
  const byChannel = {};
  let inflows = 0;
  let outflows = 0;

  for (const r of rows) {
    byType[r.type] = (byType[r.type] || 0) + r.amount_bdt * (INFLOW.has(r.type) ? 1 : -1);
    byChannel[r.channel || "other"] = (byChannel[r.channel || "other"] || 0) + r.amount_bdt * (INFLOW.has(r.type) ? 1 : -1);
    if (INFLOW.has(r.type)) inflows += r.amount_bdt;
    else outflows += r.amount_bdt;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Icon name="Wallet" size={22} className="text-emerald-600" />
        <h1 className="text-xl font-semibold text-gray-800">ক্যাশ বুক</h1>
      </div>

      {/* Cash in hand — big card */}
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <p className="text-sm text-gray-500">হাতে থাকা নগদ</p>
        <p className={`text-4xl font-bold ${cashInHand >= 0 ? "text-emerald-600" : "text-red-600"}`}>
          {taka(cashInHand)}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          মোট লেনদেন: {rows.length}টি · প্রবেশ: {taka(inflows)} · প্রস্থান: {taka(outflows)}
        </p>
      </div>

      {/* Channel breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(byChannel)
          .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
          .map(([ch, amt]) => (
            <div key={ch} className="rounded-xl border border-gray-100 bg-white p-3">
              <p className="text-xs text-gray-500">{CHANNEL_LABEL[ch] || ch}</p>
              <p className={`text-lg font-bold ${amt >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {taka(amt)}
              </p>
            </div>
          ))}
      </div>

      {/* Cash entry form */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 flex items-center justify-center">
        <CashForm />
      </div>

      {/* Full transaction ledger */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="py-2 pr-4">তারিখ</th>
              <th className="py-2 pr-4">ধরন</th>
              <th className="py-2 pr-4">চ্যানেল</th>
              <th className="py-2 pr-4">রেফারেন্স</th>
              <th className="py-2 pr-4">নোট</th>
              <th className="py-2 pr-4 text-right">পরিমাণ</th>
              <th className="py-2 text-right">ব্যালেন্স</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-400">
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
                  <td className="py-2 pr-4">
                    <span className={`font-medium ${TYPE_COLOR[r.type]}`}>{TYPE_LABEL[r.type] || r.type}</span>
                  </td>
                  <td className="py-2 pr-4 text-gray-500">{CHANNEL_LABEL[r.channel] || r.channel || "—"}</td>
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
