// app/admin-v2/sales/direct/page.jsx
import { createClient } from "@/lib/supabase/server";
import DirectSaleController from "./DirectSaleController";
import Icon from "@/components/Icon";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getInitialData() {
  const sb = await createClient();
  
  const { data: products } = await sb
    .from("products")
    .select("id, name, name_bn, price_bdt")
    .order("name");
    
  const { data: customers } = await sb
    .from("customers")
    .select("id, name, phone")
    .order("name");

  return { 
    products: products || [], 
    customers: customers || [] 
  };
}

export default async function DirectSalePage() {
  const { products, customers } = await getInitialData();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">ডাইরেক্ট সেল (Direct Sale)</h1>
          <p className="text-sm text-ink-muted">দ্রুত পণ্য নির্বাচন করুন এবং সরাসরি বিক্রয় সম্পন্ন করুন।</p>
        </div>
        <Link 
          href="/admin-v2" 
          className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-ink transition-colors"
        >
          <Icon name="ArrowLeft" size={16} /> ড্যাশবোর্ডে ফিরে যান
        </Link>
      </div>

      <DirectSaleController 
        initialProducts={products} 
        initialCustomers={customers} 
      />
    </div>
  );
}
