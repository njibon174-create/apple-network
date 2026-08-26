// app/admin/stock/add/page.jsx — Add Stock entry point (owner-only).
import { createClient } from "@/lib/supabase/server";
import StockAddForm from "./StockAddForm";

export const dynamic = "force-dynamic";

export default async function AddStockPage() {
  const sb = await createClient();
  const [{ data: cats }, { data: prods }] = await Promise.all([
    sb.from("categories").select("id, name_bn, name_en, slug").order("name_bn"),
    sb.from("products").select("brand").not("brand", "is", null),
  ]);
  // Distinct brand list for the datalist.
  const brands = Array.from(
    new Set((prods || []).map((p) => p.brand).filter(Boolean))
  ).sort();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-ink">নতুন স্টক যোগ করুন</h1>
      <p className="mt-1 text-sm text-ink-muted">
        ক্যাটাগরি → ব্র্যান্ড → মডেল → অবস্থা → অফিশিয়াল/আনঅফিশিয়াল।
      </p>
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6">
        <StockAddForm categories={cats || []} brands={brands} />
      </div>
    </div>
  );
}
