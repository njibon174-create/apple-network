// app/admin/reports/page.jsx — Profit / Loss report.
// Revenue - COGS - Expenses = Profit, plus best-sellers. Owner-only via RLS.
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export default async function ReportsPage({ searchParams }) {
  const { start: defStart, end: defEnd } = monthBounds();
  const fromIso = searchParams?.from
    ? new Date(searchParams.from).toISOString()
    : defStart.toISOString();
  const toIso = searchParams?.to
    ? new Date(searchParams.to + "T23:59:59").toISOString()
    : defEnd.toISOString();
  const fromVal = (searchParams?.from || "").slice(0, 10);
  const toVal = (searchParams?.to || defEnd.toISOString().slice(0, 10));

  const sb = await createClient();

  // Orders (with items) in range, excluding cancelled.
  const { data: orders } = await sb
    .from("orders")
    .select(
      "id, status, total_bdt, order_items(id, product_id, qty, line_total_bdt)"
    )
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .neq("status", "cancelled");

  const orderList = orders || [];
  let revenue = 0;
  let cogs = 0;
  const qtyByProduct = {};

  // Average cost per product for COGS.
  const { data: ledger } = await sb
    .from("stock_ledger")
    .select("product_id, avg_cost_bdt");
  const costMap = {};
  for (const l of ledger || []) costMap[l.product_id] = l.avg_cost_bdt || 0;

  for (const o of orderList) {
    for (const it of o.order_items || []) {
      const line = it.line_total_bdt || 0;
      revenue += line;
      const cost = costMap[it.product_id] || 0;
      cogs += it.qty * cost;
      qtyByProduct[it.product_id] = (qtyByProduct[it.product_id] || 0) + it.qty;
    }
  }

  // Expenses in range.
  const { data: exp } = await sb
    .from("expenses")
    .select("amount_bdt")
    .gte("created_at", fromIso)
    .lte("created_at", toIso);
  const expenses = (exp || []).reduce((s, r) => s + r.amount_bdt, 0);

  const profit = revenue - cogs - expenses;
  const zeroCost = Object.values(costMap).some((c) => c === 0);

  // Best-sellers top 5 by qty (need product names).
  const topIds = Object.entries(qtyByProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  let names = {};
  if (topIds.length) {
    const { data: prods } = await sb
      .from("products")
      .select("id, name")
      .in("id", topIds.map((t) => t[0]));
    for (const p of prods || []) names[p.id] = p.name;
  }
  const bestSellers = topIds.map(([pid, qty]) => ({
    name: names[pid] || "অজানা",
    qty,
  }));

  const cards = [
    { label: "রাজস্ব (Revenue)", value: revenue, color: "text-gray-800" },
    { label: "পণ্য ব্যয় (COGS)", value: cogs, color: "text-gray-800" },
    { label: "খরচ (Expenses)", value: expenses, color: "text-gray-800" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Icon name="BarChart3" size={22} className="text-emerald-600" />
        <h1 className="text-xl font-semibold text-gray-800">প্রফিট-লস রিপোর্ট</h1>
      </div>

      <form method="get" className="rounded-xl border border-gray-100 bg-white p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">শুরুর তারিখ</label>
          <input type="date" name="from" defaultValue={fromVal} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">শেষ তারিখ</label>
          <input type="date" name="to" defaultValue={toVal} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700">
          দেখুন
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{taka(c.value)}</p>
          </div>
        ))}
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-sm text-gray-500">নিট লাভ (NET PROFIT)</p>
          <p className={`text-2xl font-bold ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {taka(profit)}
          </p>
        </div>
      </div>

      {zeroCost && (
        <p className="text-xs text-amber-600">
          কিছু পণ্যের গড় খরচ (avg_cost) ০ — COGS ০ দেখানো হয়েছে।
        </p>
      )}

      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <p className="text-sm text-gray-500 mb-2">
          অর্ডার সংখ্যা: <span className="font-semibold text-gray-800">{orderList.length}</span>
        </p>
        <h2 className="font-semibold text-gray-700 mb-2">সেরা বিক্রেতা (শীর্ষ ৫)</h2>
        {bestSellers.length === 0 ? (
          <p className="text-gray-400 text-sm">কোনো বিক্রয় নেই</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {bestSellers.map((b, i) => (
              <li key={i} className="flex justify-between border-b border-gray-50 py-1">
                <span>{b.name}</span>
                <span className="font-medium text-gray-700">{b.qty} পিস</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
