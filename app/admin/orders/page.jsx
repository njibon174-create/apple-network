// app/admin/orders/page.jsx — Order Management (server component, read-only).
// Renders every order as a row in a table with full details, pipeline tags, and actions.
import { sbAdminOrders } from "@/lib/orders-admin";
import OrderRow from "./OrderRow";

export const dynamic = "force-dynamic";

const STATUS_LABEL = {
  new: "পেন্ডিং",
  calling: "কল করা হচ্ছে",
  confirmed: "কনফার্মড",
  preparing: "প্যাকিং",
  shipping: "শিপিং",
  delivered: "ডেলিভারড",
  cancelled: "বাতিল",
};

const SOURCE_LABEL = { online: "ওয়েবসাইট", pos: "POS" };

export default async function OrdersPage({ searchParams }) {
  const src = searchParams?.src || "all"; // all | online | pos
  const orders = await sbAdminOrders(src);

  const counts = { all: orders.length, online: 0, pos: 0 };
  orders.forEach((o) => {
    if (o.source === "pos") counts.pos++;
    else counts.online++;
  });

  const tabs = [
    { key: "all", label: "সব" },
    { key: "online", label: "ওয়েবসাইট" },
    { key: "pos", label: "POS" },
  ];

  return (
    <div className="min-w-[800px]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">অর্ডার ম্যানেজমেন্ট</h1>
          <p className="text-sm text-ink-muted">ওয়েবসাইট ও POS থেকে আসা সব অর্ডার</p>
        </div>
      </div>

      {/* Source filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = src === t.key;
          return (
            <a
              key={t.key}
              href={`/admin/orders?src=${t.key}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-brand text-white"
                  : "bg-white text-ink-soft hover:bg-gray-100"
              }`}
            >
              {t.label} ({counts[t.key]})
            </a>
          );
        })}
      </div>

      {/* Orders table */}
      {orders.length === 0 ? (
        <div className="rounded-xl2 border border-gray-100 bg-white p-10 text-center text-ink-muted">
          এই তালিকায় কোনো অর্ডার নেই।
        </div>
      ) : (
        <div className="rounded-xl2 border border-gray-100 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted border-b border-gray-100">
                <th className="py-3 pr-2 whitespace-nowrap">অর্ডার</th>
                <th className="py-3 pr-3 whitespace-nowrap">তারিখ</th>
                <th className="py-3 pr-3 whitespace-nowrap">সোর্স</th>
                <th className="py-3 pr-3 whitespace-nowrap">কাস্টমার</th>
                <th className="py-3 pr-3 whitespace-nowrap">ফোন</th>
                <th className="py-3 pr-3 whitespace-nowrap">ঠিকানা</th>
                <th className="py-3 pr-3 whitespace-nowrap">পেমেন্ট</th>
                <th className="py-3 pr-3 text-right whitespace-nowrap">টোটাল</th>
                <th className="py-3 pr-3 whitespace-nowrap">অবস্থা</th>
                <th className="py-3 pr-3 whitespace-nowrap">ট্যাগ</th>
                <th className="py-3 pr-3 whitespace-nowrap">একশন</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <OrderRow
                  key={o.order_number}
                  order={o}
                  statusLabel={STATUS_LABEL}
                  sourceLabel={SOURCE_LABEL}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state for filtered view */}
      {orders.length === 0 && (
        <div className="mt-4 rounded-xl2 border border-gray-100 bg-white p-10 text-center text-ink-muted">
          এই তালিকায় কোনো অর্ডার নেই।
        </div>
      )}
    </div>
  );
}
