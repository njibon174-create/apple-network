// app/admin/products/new/page.jsx — create product (with brand/model).
import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProduct() {
  const sb = await createClient();
  const { data: categories } = await sb
    .from("categories")
    .select("id, name_bn, name_en, slug")
    .order("name_bn");

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">নতুন প্রোডাক্ট</h1>
      <p className="mt-1 text-sm text-ink-muted">নতুন প্রোডাক্ট যোগ করুন</p>
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6">
        <ProductForm categories={categories || []} />
      </div>
    </div>
  );
}
