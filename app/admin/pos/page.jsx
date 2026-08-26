// app/admin/pos/page.jsx — Point of Sale (sell from the shop). Owner-only.
import { createClient } from "@/lib/supabase/server";
import PosForm from "./PosForm";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const sb = await createClient();
  const { data: products } = await sb
    .from("products")
    .select("id, name, brand, price_bdt, condition, official, in_stock")
    .order("name");
  const { data: stock } = await sb.from("stock_ledger").select("product_id, qty");
  const stockMap = Object.fromEntries((stock || []).map((s) => [s.product_id, s.qty]));

  const list = (products || []).map((p) => ({
    ...p,
    stock: stockMap[p.id] ?? 0,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">পয়েন্ট অফ সেল (দোকান থেকে বিক্রয়)</h1>
      <p className="mt-1 text-sm text-ink-muted">পণ্য বাছাই করুন, পেমেন্ট পদ্ধতি দিন, তারপর সেল করুন।</p>
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6">
        <PosForm products={list} />
      </div>
    </div>
  );
}
