// app/admin/page.jsx — Admin dashboard with charts (Phase A)
import Link from "next/link";
import nextDynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";

// Charts are client-only (Recharts measures the DOM); load without SSR to avoid
// hydration/blank-render issues on the server.
const ChartPanel = nextDynamic(() => import("./DashboardCharts"), { ssr: false });

export const dynamic = "force-dynamic";

const STATUS_LABEL = {
  confirmed: "কনফার্মড", preparing: "প্রস্তুত", shipping: "শিপিং",
  delivered: "ডেলিভারড", cancelled: "বাতিল",
};

export default async function AdminDashboard() {
  const sb = await createClient();

  // KPIs
  const today = new Date().toISOString().slice(0, 10);
  const [{ count: pending }, { data: recent }, { count: newMsgs }, { data: todays }] = await Promise.all([
    sb.from("orders").select("*", { count: "exact", head: true }).in("status", ["confirmed", "preparing", "shipping"]),
    sb.from("orders").select("order_number, status, total_bdt, created_at, shipping_name").order("created_at", { ascending: false }).limit(5),
    sb.from("inquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
    sb.from("orders").select("total_bdt").gte("created_at", today + "T00:00:00"),
  ]);
  const todayRevenue = (todays || []).reduce((s, o) => s + (o.total_bdt || 0), 0);

  // Last 14 days revenue trend
  const days = [];
  const { data: dayRows } = await sb
    .from("orders")
    .select("total_bdt, created_at")
    .gte("created_at", new Date(Date.now() - 14 * 864e5).toISOString());
  const byDay = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const key = d.toISOString().slice(0, 10);
    byDay[key] = 0;
  }
  (dayRows || []).forEach((o) => {
    const k = (o.created_at || "").slice(0, 10);
    if (k in byDay) byDay[k] += o.total_bdt || 0;
  });
  const revenueData = Object.entries(byDay).map(([k, v]) => ({ label: k.slice(5), revenue: v }));

  // Status distribution
  const { data: allOrders } = await sb.from("orders").select("status");
  const statusMap = {};
  (allOrders || []).forEach((o) => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
  const statusData = Object.entries(statusMap).map(([k, v]) => ({ name: STATUS_LABEL[k] || k, value: v }));

  // Category revenue: map product_id -> category via products + categories
  const [{ data: prodRows }, { data: catRows }] = await Promise.all([
    sb.from("order_items").select("line_total_bdt, product_id"),
    sb.from("products").select("id, category_id"),
  ]);
  const catById = {};
  (catRows || []).forEach((p) => { catById[p.id] = p.category_id; });
  const { data: catSlugs } = await sb.from("categories").select("id, slug");
  const slugById = {};
  (catSlugs || []).forEach((c) => { slugById[c.id] = c.slug; });
  const catRev = {};
  (prodRows || []).forEach((r) => {
    const cid = catById[r.product_id];
    const slug = (cid && slugById[cid]) || "other";
    catRev[slug] = (catRev[slug] || 0) + (r.line_total_bdt || 0);
  });
  const categoryData = Object.entries(catRev).map(([k, v]) => ({ name: k, revenue: v }));

  const stats = [
    { label: "আজকের বিক্রয়", value: taka(todayRevenue), icon: "TrendingUp", href: "/admin/orders", color: "text-brand" },
    { label: "চলমান অর্ডার", value: pending ?? 0, icon: "ShoppingBag", href: "/admin/orders", color: "text-accent-teal" },
    { label: "নতুন মেসেজ", value: newMsgs ?? 0, icon: "MessageSquare", href: "/admin/messages", color: "text-accent-yellow" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">ড্যাশবোর্ড</h1>
      <p className="mt-1 text-sm text-ink-muted">আজ: {today}</p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl border border-gray-100 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-muted">{s.label}</p>
              <Icon name={s.icon} size={18} className={s.color} />
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartPanel
          revenueData={revenueData}
          statusData={statusData}
          categoryData={categoryData}
        />
      </div>

      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink">সাম্প্রতিক অর্ডার</h2>
          <Link href="/admin/orders" className="text-sm text-brand hover:underline">সব দেখুন</Link>
        </div>
        {recent && recent.length ? (
          <div className="divide-y divide-gray-100">
            {recent.map((o) => (
              <div key={o.order_number} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-ink">{o.order_number}</p>
                  <p className="text-xs text-ink-muted">{o.shipping_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-ink">{taka(o.total_bdt)}</p>
                  <p className="text-xs text-ink-muted">{STATUS_LABEL[o.status] || o.status}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-ink-muted">কোনো অর্ডার নেই।</p>
        )}
      </div>
    </div>
  );
}
