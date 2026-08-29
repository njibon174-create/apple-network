// app/admin-v2/customers/[id]/page.jsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";
import Link from "next/link";
import QuickSellModal from "../QuickSellModal"; // We will reuse the modal but ensure it's in v2
import CRMProfileSection from "../CRMProfileSection"; // We will migrate this to v2

export const dynamic = "force-dynamic";

async function getCustomerFullData(id) {
  const sb = await createClient();
  
  // Fetch main profile
  const { data: customer } = await sb
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();
    
  if (!customer) return null;

  // Fetch related data
  const { data: phones } = await sb.from("customer_phones").select("*").eq("customer_id", id).order("is_primary", { ascending: false });
  const { data: addresses } = await sb.from("customer_addresses").select("*").eq("customer_id", id).order("is_default", { ascending: false });
  const { data: activities } = await sb.from("customer_activity_log").select("*").eq("customer_id", id).order("created_at", { ascending: false });
  const { data: credit_sales } = await sb.from("credit_sales").select("*").eq("customer_id", id).order("created_at", { ascending: false });
  const { data: orders } = await sb.from("orders").select("id, total_bdt").eq("customer_id", id);

  const totalSpent = (orders || []).reduce((sum, o) => sum + (o.total_bdt || 0), 0);

  return {
    ...customer,
    phones: phones || [],
    addresses: addresses || [],
    activities: activities || [],
    credit_sales: credit_sales || [],
    total_spent: totalSpent,
  };
}

export default async function Customer360View({ params }) {
  const customer = await getCustomerFullData(params.id);
  if (!customer) notFound();

  // Fetch products for Quick Sell
  const sb = await createClient();
  const { data: products } = await sb.from("products").select("id, name, price_bdt").order("name");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin-v2/customers" className="p-2 rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-brand transition-colors">
            <Icon name="ArrowLeft" size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink">{customer.name || "Unknown Customer"}</h1>
            <p className="text-sm text-ink-muted">{customer.phone} · {customer.type}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gray-50">
            <Icon name="Edit" size={16} /> প্রোফাইল এডিট
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 shadow-lg shadow-brand/20">
            <Icon name="ShoppingCart" size={16} /> কুইক সেল
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Profile & Quick Stats */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-brand-light flex items-center justify-center text-brand text-2xl font-bold">
                {(customer.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink">{customer.name}</h2>
                <p className="text-xs text-gray-400">সদস্য since {new Date(customer.created_at).toLocaleDateString("bn-BD")}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400">ফোন:</span>
                <span className="text-sm font-medium text-ink">{customer.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400">ইমেইল:</span>
                <span className="text-sm font-medium text-ink">{customer.email || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-xs text-gray-400">ধরণ:</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${customer.type === 'credit' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                  {customer.type}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase">মোট খরচ</p>
              <p className="text-xl font-bold text-ink">{taka(customer.total_spent)}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase">বাকি টাকা</p>
              <p className="text-xl font-bold text-red-600">{taka(customer.credit_outstanding || 0)}</p>
            </div>
          </div>
        </div>

        {/* Right: Activity & Ledger */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 p-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">অ্যাক্টিভিটি লগ</h3>
              <Icon name="History" size={18} className="text-gray-400" />
            </div>
            <div className="divide-y divide-gray-50">
              {customer.activities.map((act) => (
                <div key={act.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-ink">{act.summary}</span>
                    <span className="text-[10px] text-gray-400">{new Date(act.created_at).toLocaleString("bn-BD")}</span>
                  </div>
                  <p className="text-xs text-gray-500">{act.detail || ""}</p>
                </div>
              ))}
              {customer.activities.length === 0 && (
                <div className="p-10 text-center text-gray-400 text-sm">কোনো অ্যাক্টিভিটি পাওয়া যায়নি।</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
