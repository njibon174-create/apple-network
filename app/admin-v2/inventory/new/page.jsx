// app/admin-v2/inventory/new/page.jsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Icon from "@/components/Icon";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getFormDefaults() {
  const sb = await createClient();
  
  const { data: brands } = await sb.from("brands").select("id, name_bn").order("name_bn");
  const { data: cats } = await sb.from("categories").select("id, name_bn").order("name_bn");
  
  return { brands: brands || [], cats: cats || [] };
}

export default async function NewProductPage() {
  const { brands, cats } = await getFormDefaults();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">নতুন প্রোডাক্ট যোগ করুন</h1>
          <p className="text-sm text-ink-muted">ইনভেন্টরিতে নতুন আইটেম যোগ করে স্টক আপডেট করুন।</p>
        </div>
        <Link 
          href="/admin-v2/inventory" 
          className="text-sm font-medium text-gray-400 hover:text-ink transition-colors"
        >
          বাতিল করুন
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <form action={async (formData) => {
          "use server";
          const sb = await createClient();
          
          const productData = {
            name: formData.get("name"),
            name_bn: formData.get("name_bn"),
            brand_id: formData.get("brand_id"),
            category_id: formData.get("category_id"),
            price_bdt: parseFloat(formData.get("price")),
            regular_price_bdt: formData.get("regular_price") ? parseFloat(formData.get("regular_price")) : null,
            condition: formData.get("condition"),
            official: formData.get("official") === "on",
            in_stock: true,
            desc_bn: formData.get("desc"),
            image_primary: formData.get("image") || "/images/products/placeholder.png",
          };

          const { error } = await sb.from("products").insert(productData);
          
          if (error) {
            console.error("Insert error:", error);
            // In a real app, we'd use a toast or error state.
          } else {
            // Also initialize stock to 0 or based on a field
            const { data: product } = await sb.from("products").select("id").insert(productData).single();
            if (product) {
              await sb.from("stock_ledger").insert({ product_id: product.id, qty: 0 });
            }
          }
          
          // Redirection handled by Next.js revalidate or redirect
        }} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">প্রোডাক্ট নাম (English)</label>
              <input 
                name="name" 
                required 
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand transition-all" 
                placeholder="e.g. iPhone 15 Pro"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">প্রোডাক্ট নাম (বাংলা)</label>
              <input 
                name="name_bn" 
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand transition-all" 
                placeholder="যেমন: আইফোন ১৫ প্রো"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ব্র্যান্ড</label>
                <select 
                  name="brand_id" 
                  required 
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
                >
                  <option value="">বাছাই করুন</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name_bn}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ক্যাটাগরি</label>
                <select 
                  name="category_id" 
                  required 
                  className="w-//full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
                >
                  <option value="">বাছাই করুন</option>
                  {cats.map(c => <option key={c.id} value={c.id}>{c.name_bn}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">বর্ণনা (বাংলা)</label>
              <textarea 
                name="desc" 
                rows={3} 
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand transition-all" 
                placeholder="প্রোডাক্টের বৈশিষ্ট্য লিখুন..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">বিক্রয় মূল্য (৳)</label>
                <input 
                  name="price" 
                  type="number" 
                  required 
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand transition-all" 
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">আগের মূল্য (৳)</label>
                <input 
                  name="regular_price" 
                  type="number" 
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand transition-all" 
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">কন্ডিশন</label>
              <select 
                name="condition" 
                required 
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
              >
                <option value="new_official">নতুন (অফিশিয়াল)</option>
                <option value="new_unofficial">নতুন (আনঅফিশিয়াল)</option>
                <option value="used_excellent">প্রিলাভড — Excellent</option>
                <option value="used_good">প্রিলাভড — Good</option>
              </select>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <input 
                type="checkbox" 
                name="official" 
                id="official" 
                className="h-4 w-4 accent-brand"
              />
              <label htmlFor="official" className="text-sm font-medium text-ink cursor-pointer">অফিশিয়াল প্রোডাক্ট</label>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ইমেজ ইউআরএল</label>
              <input 
                name="image" 
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand transition-all" 
                placeholder="/images/products/iphone.png"
              />
            </div>
          </div>

          <div className="md:col-span-2 pt-4">
            <button 
              type="submit" 
              className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-600 shadow-lg shadow-brand/20"
            >
              প্রোডাক্ট সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
