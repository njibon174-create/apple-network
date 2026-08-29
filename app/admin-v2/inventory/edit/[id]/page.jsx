// app/admin-v2/inventory/edit/[id]/page.jsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Icon from "@/components/Icon";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getProductDetails(id) {
  const sb = await createClient();
  
  const { data: product } = await sb
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
    
  const { data: brands } = await sb.from("brands").select("id, name_bn").order("name_bn");
  const { data: cats } = await sb.from("categories").select("id, name_bn").order("name_bn");
  
  return { product, brands: brands || [], cats: cats || [] };
}

export default async function EditProductPage({ params }) {
  const { id } = params;
  const { product, brands, cats } = await getProductDetails(id);

  if (!product) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">প্রোডাক্ট আপডেট করুন</h1>
          <p className="text-sm text-ink-muted">{product.name} এর তথ্য পরিবর্তন করুন।</p>
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
          
          const patch = {
            name: formData.get("name"),
            name_bn: formData.get("name_bn"),
            brand_id: formData.get("brand_id"),
            category_id: formData.get("category_id"),
            price_bdt: parseFloat(formData.get("price")),
            regular_price_bdt: formData.get("regular_price") ? parseFloat(formData.get("regular_price")) : null,
            condition: formData.get("condition"),
            official: formData.get("official") === "on",
            desc_bn: formData.get("desc"),
            image_primary: formData.get("image"),
          };

          const { error } = await sb.from("products").update(patch).eq("id", id);
          
          if (error) {
            console.error("Update error:", error);
          }
        }} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">প্রোডাক্ট নাম (English)</label>
              <input 
                name="name" 
                defaultValue={product.name}
                required 
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand transition-all" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">প্রোডাক্ট নাম (বাংলা)</label>
              <input 
                name="name_bn" 
                defaultValue={product.name_bn}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand transition-all" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ব্র্যান্ড</label>
                <select 
                  name="brand_id" 
                  required 
                  defaultValue={product.brand_id}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
                >
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name_bn}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ক্যাটাগরি</label>
                <select 
                  name="category_id" 
                  required 
                  defaultValue={product.category_id}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
                >
                  {cats.map(c => <option key={c.id} value={c.id}>{c.name_bn}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">বর্ণনা (বাংলা)</label>
              <textarea 
                name="desc" 
                rows={3} 
                defaultValue={product.desc_bn}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand transition-all" 
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
                  defaultValue={product.price_bdt}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand transition-all" 
                />
              </div>
              <div>
                <label className, "block text-xs font-bold text-gray-400 uppercase mb-1">আগের মূল্য (৳)</label>
                <input 
                  name="regular_price" 
                  type="number" 
                  defaultValue={product.regular_price_bdt}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand transition-all" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">কন্ডিশন</label>
              <select 
                name="condition" 
                required 
                defaultValue={product.condition}
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
                defaultChecked={product.official}
                className="h-4 w-4 accent-brand"
              />
              <label htmlFor="official" className="text-sm font-medium text-ink cursor-pointer">অফিশিয়াল প্রোডাক্ট</label>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ইমেজ ইউআরএল</label>
              <input 
                name="image" 
                defaultValue={product.image_primary}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand transition-all" 
              />
            </div>
          </div>

          <div className="md:col-span-2 pt-4">
            <button 
              type="submit" 
              className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-600 shadow-lg shadow-brand/20"
            >
              আপডেট সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
