// app/admin/stock/[id]/page.jsx — edit a model's info (owner-only).
import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditStock({ params }) {
  const sb = await createClient();
  const [{ data: product }, { data: cats }] = await Promise.all([
    sb.from("products").select("*").eq("id", params.id).single(),
    sb.from("categories").select("id, name_bn, name_en, slug").order("name_bn"),
  ]);

  if (!product) {
    return <p className="text-sm text-ink-muted">প্রোডাক্ট পাওয়া যায়নি।</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-ink">এডিট: {product.name}</h1>
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6">
        <ProductForm product={product} categories={cats || []} />
      </div>
    </div>
  );
}
