// app/admin-v2/returns/new/page.jsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Icon from "@/components/Icon";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getInitialData() {
  const sb = await createClient();
  const { data: products } = await sb.from("products").select("id, name, price_bdt").order("name");
  const { data: customers } = await sb.from("customers").select("id, name, phone").order("name");
  return { products: products || [], customers: customers || [] };
}

export default async function NewReturnPage() {
  const { products, customers } = await getInitialData();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">নতুন রিটার্ন রেকর্ড করুন</h1>
          <p className="text-sm text-ink-muted">প্রোডাক্ট ফেরত নিন এবং স্টক আপডেট করুন।</p>
        </div>
        <Link href="/admin-v2/returns" className="text-sm font-medium text-gray-400 hover:text-ink transition-colors">বাতিল করুন</Link>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <form action={async (formData) => {
          "use server";
          const sb = await createClient();
          const productId = formData.get("product_id");
          const customerId = formData.get("customer_id");
          const qty = parseInt(formData.get("qty"));
          const reason = formData.get("reason");

          // 1. Record Return
          const { data: returnData, error: rError } = await sb.from("returns").insert({
            customer_id: customerId,
            product_id: productId,
            quantity: qty,
            reason: reason,
            status: "completed",
          }).select().single();

          if (rError) return;

          // 2. IMPORTANT: Add back to stock
          await sb.from("stock_ledger").insert({
            product_id: productId,
            qty: qty, // Positive value adds back to stock
            type: "return",
            created_at: new Date().toISOString(),
          });

          redirect("/admin-v2/returns");
        }} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">কাস্টমার</label>
              <select name="customer_id" required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand">
                <option value="">বাছাই করুন</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">প্রোডাক্ট</label>
              <select name="product_id" required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand">
                <option value="">বাছাই করুন</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">পরিমাণ</label>
              <input name="qty" type="number" required defaultValue="1" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">কারণ</label>
              <input name="reason" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" placeholder="যেমন: ডিফেক্টিভ প্রোডাক্ট" />
            </div>
          </div>
          <div className="md:col-span-2 pt-4">
            <button type="submit" className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-600 shadow-lg shadow-brand/20">রিটার্ন সম্পন্ন করুন এবং স্টক আপডেট করুন</button>
          </div>
        </form>
      </div>
    </div>
  );
}
