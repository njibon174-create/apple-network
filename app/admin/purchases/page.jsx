// app/admin/purchases/page.jsx — record new stock / supplier purchase (Phase B)
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";
import PurchaseForm from "@/components/admin/PurchaseForm";

export const dynamic = "force-dynamic";

export default async function AdminPurchases() {
  const sb = await createClient();
  const [{ data: products }, { data: purchases }] = await Promise.all([
    sb.from("products").select("id, name").order("name"),
    sb
      .from("purchases")
      .select("id, product_name, supplier, qty, unit_cost_bdt, total_cost_bdt, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">নতুন স্টক / ক্রয়</h1>
      <p className="mt-1 text-sm text-ink-muted">সাপ্লায়ার ক্রয় রেকর্ড করুন (স্টক ও ক্যাশ আপডেট হবে)</p>

      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6">
        <PurchaseForm products={products || []} />
      </div>

      <h2 className="mt-8 font-semibold text-ink">সাম্প্রতিক ক্রয়</h2>
      <div className="mt-3 space-y-2">
        {purchases?.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand">
                <Icon name="Truck" size={18} />
              </div>
              <div>
                <p className="font-medium text-ink">{p.product_name || "—"}</p>
                <p className="text-xs text-ink-muted">
                  {p.supplier || "অজানা সাপ্লায়ার"} · {p.qty} পিস · {taka(p.unit_cost_bdt)}/পিস
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-ink">{taka(p.total_cost_bdt)}</p>
              <p className="text-xs text-ink-muted">
                {new Date(p.created_at).toLocaleString("bn-BD")}
              </p>
            </div>
          </div>
        ))}
        {!purchases?.length && (
          <p className="rounded-lg bg-white p-8 text-center text-sm text-ink-muted">
            কোনো ক্রয় নেই।
          </p>
        )}
      </div>
    </div>
  );
}
