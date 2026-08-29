// app/admin-v2/customers/new/page.jsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Icon from "@/components/Icon";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewCustomerPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">নতুন কাস্টমার যোগ করুন</h1>
          <p className="text-sm text-ink-muted">আপনার কাস্টমার ডেটাবেসে নতুন সদস্য যোগ করুন।</p>
        </div>
        <Link 
          href="/admin-v2/customers" 
          className="text-sm font-medium text-gray-400 hover:text-ink transition-colors"
        >
          বাতিল করুন
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <form action={async (formData) => {
          "use server";
          const sb = await createClient();
          
          const customerData = {
            name: formData.get("name"),
            phone: formData.get("phone"),
            email: formData.get("email"),
            type: formData.get("type"),
            address: formData.get("address"),
          };

          const { error } = await sb.from("customers").insert(customerData);
          
          if (error) {
            console.error("Insert error:", error);
          } else {
            redirect("/admin-v2/customers");
          }
        }} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">নাম</label>
              <input 
                name="name" 
                required 
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand transition-all" 
                placeholder="কাস্টমারের নাম লিখুন"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ফোন নম্বর</label>
              <input 
                name="phone" 
                required 
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand transition-all" 
                placeholder="০১৭XXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ইমেইল (ঐচ্ছিক)</label>
              <input 
                name="email" 
                type="email" 
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand transition-all" 
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">কাস্টমার ধরণ</label>
              <select 
                name="type" 
                required 
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
              >
                <option value="walk-in">সাধারণ (Walk-in)</option>
                <option value="credit">ক্রেডিট কাস্টমার (Credit)</option>
                <option value="emi">ইএমআই (EMI)</option>
                <option value="corporate">কর্পোরেট (Corporate)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ঠিকানা</label>
              <textarea 
                name="address" 
                rows={3} 
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand transition-all" 
                placeholder="কাস্টমারের ঠিকানা লিখুন..."
              />
            </div>
          </div>

          <div className="md:col-span-2 pt-4">
            <button 
              type="submit" 
              className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-600 shadow-lg shadow-brand/20"
            >
              কাস্টমার সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
