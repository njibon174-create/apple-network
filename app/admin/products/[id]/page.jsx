// app/admin/products/[id]/page.jsx — edit product (Phase B)
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params }) {
  const sb = await createClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    sb.from("products").select("*").eq("id", params.id).maybeSingle(),
    sb.from("categories").select("id, name_bn, name_en, slug").order("name_bn"),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">প্রোডাক্ট এডিট</h1>
      <p className="mt-1 text-sm text-ink-muted">{product.name}</p>
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6">
        <ProductForm product={product} categories={categories || []} />
      </div>
    </div>
  );
}
