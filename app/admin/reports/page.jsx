// app/admin/reports/page.jsx — Comprehensive Reports: P&L, Sales by Channel, Credit
// Outstanding, Inventory Valuation, Returns Report. Owner-only via RLS.
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

const REPORT_TABS = [
  { id: "pl", label: "প্রফিট-লস", icon: "BarChart3" },
  { id: "channel", label: "চ্যানেল বিক্রয়", icon: "PieChart" },
  { id: "credit", label: "ক্রেডিট বাকি", icon: "Wallet" },
  { id: "inventory", label: "ইনভেন্টরি মূল্য", icon: "Package" },
  { id: "returns", label: "রিটার্ন রিপোর্ট", icon: "Undo2" },
];

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export default async function ReportsPage({ searchParams }) {
  const tab = (searchParams?.tab || "pl").trim();
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
  const periodFrom = fromIso;
  const periodTo = toIso;

  // ── P&L Data ─────────────────────────────────────────────────────────
  const { data: orders } = await sb
    .from("orders")
    .select("id, status, total_bdt, source, order_items(id, product_id, qty, line_total_bdt)")
    .gte("created_at", periodFrom)
    .lte("created_at", periodTo)
    .neq("status", "cancelled");
  const orderList = orders || [];

  const { data: ledger } = await sb
    .from("stock_ledger")
    .select("product_id, avg_cost_bdt");
  const costMap = {};
  for (const l of ledger || []) costMap[l.product_id] = l.avg_cost_bdt || 0;

  let revenue = 0;
  let cogs = 0;
  const qtyByProduct = {};
  const salesByChannel = {};

  for (const o of orderList) {
    for (const it of o.order_items || []) {
      const line = it.line_total_bdt || 0;
      revenue += line;
      const cost = costMap[it.product_id] || 0;
      cogs += it.qty * cost;
      qtyByProduct[it.product_id] = (qtyByProduct[it.product_id] || 0) + it.qty;
    }
    const ch = o.source || "online";
    salesByChannel[ch] = (salesByChannel[ch] || 0) + o.total_bdt;
  }

  const { data: exp } = await sb
    .from("expenses")
    .select("amount_bdt")
    .gte("created_at", periodFrom)
    .lte("created_at", periodTo);
  const expenses = (exp || []).reduce((s, r) => s + r.amount_bdt, 0);

  const profit = revenue - cogs - expenses;
  const zeroCost = Object.values(costMap).some((c) => c === 0);

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

  // ── Inventory Valuation ──────────────────────────────────────────────
  const { data: invData } = await sb
    .from("stock_ledger")
    .select("product_id, qty, avg_cost_bdt")
    .order("qty", { ascending: false });
  const invRows = invData || [];
  const invWithNames = invRows.filter((r) => r.qty > 0).map((r) => {
    const name = r.product_id ? (names[r.product_id] || "অজানা") : "অজানা";
    return { ...r, product_name: name, total_value: r.qty * r.avg_cost_bdt };
  });
  const totalInvValue = invWithNames.reduce((s, r) => s + r.total_value, 0);

  // ── Returns Report ───────────────────────────────────────────────────
  const { data: returns } = await sb
    .from("returns")
    .select("id, order_number, product_name, reason, condition, qty, refund_bdt, restock, status, created_at")
    .order("created_at", { ascending: false });
  const returnsList = returns || [];
  const returnsTotal = returnsList.reduce((s, r) => s + r.refund_bdt, 0);
  const returnsByStatus = {};
  for (const r of returnsList) {
    returnsByStatus[r.status] = (returnsByStatus[r.status] || 0) + 1;
  }

  // ── Credit Outstanding ───────────────────────────────────────────────
  const { data: creditSales } = await sb
    .from("credit_sales")
    .select("id, total_due, amount_paid, due_date, status, customers(name, phone)")
    .order("created_at", { ascending: false });
  const creditList = creditSales || [];
  const creditTotalDue = creditList.reduce((s, c) => s + c.total_due, 0);
  const creditTotalPaid = creditList.reduce((s, c) => s + c.amount_paid, 0);
  const creditOutstanding = creditTotalDue - creditTotalPaid;

  const { data: emis } = await sb
    .from("emis")
    .select("id, total_bdt, months, monthly_bdt, paid_months, status, customers(name, phone)")
    .order("created_at", { ascending: false });
  const emiList = emis || [];
  const emiOutstanding = emiList.reduce((s, e) => s + e.total_bdt - e.monthly_bdt * e.paid_months, 0);
  const totalCreditOutstanding = creditOutstanding + emiOutstanding;

  const channelLabels = { online: "অনলাইন", pos: "POS", credit: "ক্রেডিট", emi: "EMI" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="BarChart3" size={22} className="text-emerald-600" />
          <h1 className="text-xl font-semibold text-gray-800">রিপোর্টস</h1>
        </div>

        {/* Date filter */}
        <form method="get" className="flex items-end gap-2">
          <input type="hidden" name="tab" value={tab} />
          <div>
            <label className="block text-xs text-gray-500 mb-1">শুরুর তারিখ</label>
            <input type="date" name="from" defaultValue={fromVal} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">শেষ তারিখ</label>
            <input type="date" name="to" defaultValue={toVal} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700">
            ফিল্টার
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {REPORT_TABS.map((t) => (
          <a
            key={t.id}
            href={`/admin/reports?tab=${t.id}&from=${fromVal}&to=${toVal}`}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition ${
              tab === t.id
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
          </a>
        ))}
      </div>

      {/* ── P&L Report ──────────────────────────────────────────────────── */}
      {tab === "pl" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-sm text-gray-500">রাজস্ব (Revenue)</p>
              <p className="text-2xl font-bold text-gray-800">{taka(revenue)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-sm text-gray-500">পণ্য ব্যয় (COGS)</p>
              <p className="text-2xl font-bold text-gray-800">{taka(cogs)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-sm text-gray-500">খরচ (Expenses)</p>
              <p className="text-2xl font-bold text-gray-800">{taka(expenses)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-sm text-gray-500">নিট লাভ (NET PROFIT)</p>
              <p className={`text-2xl font-bold ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {taka(profit)}
              </p>
            </div>
          </div>

          {/* Sales by channel */}
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h3 className="font-semibold text-gray-700 mb-3">চ্যানেল অনুযায়ী বিক্রয়</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4">চ্যানেল</th>
                  <th className="py-2 text-right">মোট বিক্রয়</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(salesByChannel).length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-3 text-center text-gray-400">কোনো বিক্রয় নেই</td>
                  </tr>
                ) : (
                  Object.entries(salesByChannel)
                    .sort((a, b) => b[1] - a[1])
                    .map(([ch, amt]) => (
                      <tr key={ch} className="border-b border-gray-50">
                        <td className="py-2 pr-4">{channelLabels[ch] || ch}</td>
                        <td className="py-2 text-right font-medium text-gray-800">{taka(amt)}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
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
            <h3 className="font-semibold text-gray-700 mb-2">সেরা বিক্রেতা (শীর্ষ ৫)</h3>
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
      )}

      {/* ── Sales by Channel ─────────────────────────────────────────────── */}
      {tab === "channel" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(salesByChannel).map(([ch, amt]) => (
              <div key={ch} className="rounded-xl border border-gray-100 bg-white p-4">
                <p className="text-xs text-gray-500">{channelLabels[ch] || ch}</p>
                <p className="text-xl font-bold text-gray-800">{taka(amt)}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4">চ্যানেল</th>
                  <th className="py-2 text-right">বিক্রয়</th>
                  <th className="py-2 text-right">শতাংশ</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(salesByChannel)
                  .sort((a, b) => b[1] - a[1])
                  .map(([ch, amt]) => (
                    <tr key={ch} className="border-b border-gray-50">
                      <td className="py-2 pr-4">{channelLabels[ch] || ch}</td>
                      <td className="py-2 text-right">{taka(amt)}</td>
                      <td className="py-2 text-right">
                        {revenue > 0 ? Math.round((amt / revenue) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Credit Outstanding ──────────────────────────────────────────── */}
      {tab === "credit" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-red-200 bg-white p-4">
              <p className="text-xs text-gray-500">ক্রেডিট বাকি (মোট)</p>
              <p className="text-2xl font-bold text-red-600">{taka(creditOutstanding)}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-white p-4">
              <p className="text-xs text-gray-500">EMI বাকি (মোট)</p>
              <p className="text-2xl font-bold text-amber-600">{taka(emiOutstanding)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-xs text-gray-500">মোট বাকি রয়েছে</p>
              <p className="text-2xl font-bold text-gray-800">{taka(totalCreditOutstanding)}</p>
            </div>
          </div>

          {/* Credit sales detail */}
          <div className="rounded-xl border border-gray-100 bg-white p-4 overflow-x-auto">
            <h3 className="font-semibold text-gray-700 mb-3">ক্রেডিট সেল বিস্তারিত</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4">কাস্টমার</th>
                  <th className="py-2 pr-4">তোলা</th>
                  <th className="py-2 pr-4">পরিশোধিত</th>
                  <th className="py-2 pr-4">বাকি</th>
                  <th className="py-2 pr-4">ডেডলাইন</th>
                  <th className="py-2">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {creditList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-400">কোনো ক্রেডিট সেল নেই</td>
                  </tr>
                )}
                {creditList.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50">
                    <td className="py-2 pr-4">
                      <span className="font-medium">{c.customers?.name || "—"}</span>
                      <p className="text-xs text-gray-500">{c.customers?.phone || ""}</p>
                    </td>
                    <td className="py-2 pr-4 text-gray-800">{taka(c.total_due)}</td>
                    <td className="py-2 pr-4 text-emerald-600">{taka(c.amount_paid)}</td>
                    <td className="py-2 pr-4 font-medium text-red-600">{taka(c.total_due - c.amount_paid)}</td>
                    <td className="py-2 pr-4 text-gray-600">{c.due_date ? new Date(c.due_date).toLocaleDateString("bn-BD") : "—"}</td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "paid" ? "bg-green-100 text-green-700" : c.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {c.status === "paid" ? "পরিশোধিত" : c.status === "partial" ? "আংশিক" : "বাকি"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* EMI detail */}
          <div className="rounded-xl border border-gray-100 bg-white p-4 overflow-x-auto">
            <h3 className="font-semibold text-gray-700 mb-3">EMI বিস্তারিত</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4">কাস্টমার</th>
                  <th className="py-2 pr-4">মোট</th>
                  <th className="py-2 pr-4">মাসিক</th>
                  <th className="py-2 pr-4">ভরণ হয়েছে</th>
                  <th className="py-2 text-right">বাকি</th>
                  <th className="py-2">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {emiList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-400">কোনো EMI নেই</td>
                  </tr>
                )}
                {emiList.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50">
                    <td className="py-2 pr-4">
                      <span className="font-medium">{e.customers?.name || "—"}</span>
                      <p className="text-xs text-gray-500">{e.customers?.phone || ""}</p>
                    </td>
                    <td className="py-2 pr-4 text-gray-800">{taka(e.total_bdt)}</td>
                    <td className="py-2 pr-4 text-gray-600">{taka(e.monthly_bdt)}</td>
                    <td className="py-2 pr-4 text-gray-600">{e.paid_months}/{e.months} মাস</td>
                    <td className="py-2 text-right font-medium text-amber-600">{taka(e.total_bdt - e.monthly_bdt * e.paid_months)}</td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.status === "completed" ? "bg-green-100 text-green-700" : e.status === "defaulted" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                        {e.status === "completed" ? "সম্পন্ন" : e.status === "defaulted" ? "ডিফল্ট" : `${e.paid_months}/${e.months}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Inventory Valuation ─────────────────────────────────────────── */}
      {tab === "inventory" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-xs text-gray-500">মোট আইটেম (স্টকে)</p>
              <p className="text-2xl font-bold text-gray-800">{invWithNames.reduce((s, r) => s + r.qty, 0)} পিস</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-xs text-gray-500">মোট ইনভেন্টরি মূল্য</p>
              <p className="text-2xl font-bold text-emerald-600">{taka(totalInvValue)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-xs text-gray-500">SKU সংখ্যা</p>
              <p className="text-2xl font-bold text-gray-800">{invWithNames.length}টি</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4">পণ্য</th>
                  <th className="py-2 pr-4">পরিমাণ</th>
                  <th className="py-2 pr-4">গড় খরচ (৳)</th>
                  <th className="py-2 text-right">মোট মূল্য (৳)</th>
                </tr>
              </thead>
              <tbody>
                {invWithNames.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">কোনো স্টক নেই</td>
                  </tr>
                )}
                {invWithNames.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-medium">{r.product_name}</td>
                    <td className="py-2 pr-4">{r.qty} পিস</td>
                    <td className="py-2 pr-4 text-gray-600">{taka(r.avg_cost_bdt)}</td>
                    <td className="py-2 text-right font-medium text-gray-800">{taka(r.total_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Returns Report ───────────────────────────────────────────────── */}
      {tab === "returns" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-xs text-gray-500">মোট রিটার্ন</p>
              <p className="text-2xl font-bold text-gray-800">{returnsList.length}টি</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-white p-4">
              <p className="text-xs text-gray-500">মোট রিফান্ড</p>
              <p className="text-2xl font-bold text-red-600">{taka(returnsTotal)}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-white p-4">
              <p className="text-xs text-gray-500">স্টকে ফেরত</p>
              <p className="text-2xl font-bold text-emerald-600">
                {returnsList.filter((r) => r.restock).length}টি
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-xs text-gray-500">রিফান্ড হয়নি</p>
              <p className="text-2xl font-bold text-gray-800">
                {returnsList.filter((r) => r.refund_bdt === 0).length}টি
              </p>
            </div>
          </div>

          {/* Status breakdown */}
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h3 className="font-semibold text-gray-700 mb-3">স্ট্যাটাস অনুযায়ী</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(returnsByStatus).map(([status, count]) => (
                <span key={status} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm">
                  <span className="font-medium text-gray-800">{status === "pending" ? "অপেক্ষায়" : status === "approved" ? "অনুমোদিত" : status === "rejected" ? "প্রত্যাখ্যান" : status === "refunded" ? "রিফান্ড" : status}</span>
                  {" "}
                  <span className="text-gray-500">({count})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Returns detail table */}
          <div className="rounded-xl border border-gray-100 bg-white p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4">তারিখ</th>
                  <th className="py-2 pr-4">অর্ডার</th>
                  <th className="py-2 pr-4">পণ্য</th>
                  <th className="py-2 pr-4">কারণ</th>
                  <th className="py-2 pr-4">পরিমাণ</th>
                  <th className="py-2 pr-4">স্টক</th>
                  <th className="py-2 text-right">রিফান্ড</th>
                  <th className="py-2 pr-4">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {returnsList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-gray-400">কোনো রিটার্ন নেই</td>
                  </tr>
                )}
                {returnsList.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="py-2 pr-4 text-gray-600">{new Date(r.created_at).toLocaleString("bn-BD")}</td>
                    <td className="py-2 pr-4 text-gray-600">{r.order_number || "—"}</td>
                    <td className="py-2 pr-4 font-medium">{r.product_name}</td>
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
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        r.status === "approved" ? "bg-blue-100 text-blue-700" :
                        r.status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-emerald-100 text-emerald-700"
                      }`}>
                        {r.status === "pending" ? "অপেক্ষায়" :
                         r.status === "approved" ? "অনুমোদিত" :
                         r.status === "rejected" ? "প্রত্যাখ্যান" :
                         "রিফান্ড করা হয়েছে"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
