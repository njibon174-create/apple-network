// app/admin-v2/orders/page.jsx
import { createClient } from "@/lib/supabase/server";
import Icon from "@/components/Icon";
import { taka } from "@/lib/data";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PIPELINES = [
  { id: "pending", label: "পেন্ডিং", color: "bg-amber-100 text-amber-700", icon: "Clock" },
  { id: "processing", label: "প্রসেসিং", color: "bg-blue-100 text-blue-700", icon: "RefreshCw" },
  { id: "shipped", label: "শিপড", color: "bg-indigo-100 text-indigo-700", icon: "Truck" },
  { id: "completed", label: "কমপ্লিটেড", color: "bg-green-100 text-green-700", icon: "CheckCircle" },
  { id: "cancelled", label: "ক্যানসেলড", color: "bg-red-100 text-red-700", icon: "XCircle" },
];

async function getOrders() {
  const sb = await createClient();
  const { data: orders } = await sb
    .from("orders")
    .select(`
      *,
      customers (name, phone)
    `)
    .order("created_at", { ascending: false });
  return orders || [];
}

export default async function OrdersCommandCenter() {
  const orders = await getOrders();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">অর্ডার কমান্ড সেন্টার</h1>
          <p className="text-sm text-ink-muted">অর্ডার পাইপলাইন এবং ডেলিভারি স্ট্যাটাস ম্যানেজ করুন।</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium text-ink">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            লাইভ আপডেট চালু
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-6 snap-x">
        {PIPELINES.map((pipeline) => {
          const pipelineOrders = orders.filter(o => o.status === pipeline.id);
          
          return (
            <div key={pipeline.id} className="min-w-[320px] w-[320px] snap-start space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${pipeline.color}`}>
                    {pipeline.label}
                  </span>
                  <span className="text-xs font-bold text-gray-400">{pipelineOrders.length}</span>
                </div>
                <Icon name={pipeline.icon} size={14} className="text-gray-300" />
              </div>

              <div className="space-y-3">
                {pipelineOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="group rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-brand hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">#{order.id.slice(0, 6)}</span>
                        <span className="text-[10px] text-gray-300">
                          {new Date(order.created_at).toLocaleDateString("bn-BD")}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-brand">
                        {taka(order.total_bdt)}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-ink line-clamp-1">
                        {order.customers?.name || "Unknown Customer"}
                      </p>
                      <p className="text-xs text-gray-400 line-clamp-1">
                        {order.customers?.phone || "No phone"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <Link 
                        href={`/admin-v2/orders/${order.id}`}
                        className="text-[11px] font-bold text-gray-400 group-hover:text-brand transition-colors"
                      >
                        ডিটেইলস দেখুন →
                      </Link>
                      <div className="flex -space-x-2">
                        <div className="h-6 w-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400">
                          S
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {pipelineOrders.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
                    <p className="text-xs text-gray-400 italic">কোনো অর্ডার নেই</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
