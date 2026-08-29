// app/admin-v2/orders/[id]/page.jsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getOrderDetails(id) {
  const sb = await createClient();
  
  const { data: order } = await sb
    .from("orders")
    .select(`
      *,
      customers (*),
      order_items (*)
    `)
    .eq("id", id)
    .single();
    
  if (!order) return null;
  
  return order;
}

export default async function OrderDetailsPage({ params }) {
  const order = await getOrderDetails(params.id);
  if (!order) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin-v2/orders" className="p-2 rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-brand transition-colors">
            <Icon name="ArrowLeft" size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink">অর্ডার ডিটেইলস</h1>
            <p className="text-sm text-ink-muted">অর্ডার আইডি: {order.id}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gray-50">
            <Icon name="Printer" size={16} /> ইনভয়েস প্রিন্ট
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 shadow-lg shadow-brand/20">
            <Icon name="CheckCircle" size={16} /> স্ট্যাটাস আপডেট
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer & Order Summary */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">কাস্টমার তথ্য</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400">নাম:</span>
                <span className="text-sm font-medium text-ink">{order.customers?.name || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400">ফোন:</span>
                <span className="text-sm font-medium text-ink">{order.customers?.phone || "—"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-xs text-gray-400">ঠিকানা:</span>
                <span className="text-sm font-medium text-ink text-right">{order.address || "—"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">পেমেন্ট সামারি</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400">মোট মূল্য:</span>
                <span className="text-sm font-medium text-ink">{taka(order.total_bdt)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400">পেইড:</span>
                <span className="text-sm font-medium text-green-600">{taka(order.paid_amount || 0)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-xs text-gray-400">বাকি:</span>
                <span className="text-sm font-bold text-red-600">{taka((order.total_bdt || 0) - (order.paid_amount || 0))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 p-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">অর্ডার আইটেমসমূহ</h3>
              <Icon name="Package" size={18} className="text-gray-400" />
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-400">
                <tr>
                  <th className="px-6 py-3 font-medium">প্রোডাক্ট</th>
                  <th className="px-6 py-3 font-medium text-center">পরিমাণ</th>
                  <th className="px-6 py-3 font-medium text-right">মূল্য</th>
                  <th className="px-6 py-3 font-medium text-right">মোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.order_items?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-ink">{item.product_name || "Unknown Product"}</td>
                    <td className="px-6 py-4 text-center text-ink-soft">{item.quantity}</td>
                    <td className="px-6 py-4 text-right text-ink-soft">{taka(item.price)}</td>
                    <td className="px-6 py-4 text-right font-bold text-ink">{taka(item.quantity * item.price)}</td>
                  </tr>
                ))}
                {(!order.order_items || order.order_items.length === 0) && (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-gray-400 italic">কোনো আইটেম পাওয়া যায়নি।</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">অর্ডার নোট</h3>
            <p className="text-sm text-ink-soft italic">
              {order.notes || "কোনো বিশেষ নোট দেওয়া হয়নি।"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
