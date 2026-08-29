// app/admin-v2/finance/FinanceActions.jsx
"use client";
import { useState } from "react";
import Icon from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";

export default function FinanceActions() {
  const [modal, setModal] = useState(null); // 'income', 'expense', 'credit'
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ amount: "", description: "", customer_id: "" });

  const handleSubmit = async () => {
    if (!form.amount) return;
    setLoading(true);
    try {
      const sb = createClient();
      const amount = parseFloat(form.amount);

      if (modal === 'income') {
        await sb.from("cash_book").insert({
          amount, type: "income", category: "Finance Hub", description: form.description, created_at: new Date().toISOString()
        });
      } else if (modal === 'expense') {
        await sb.from("cash_book").insert({
          amount, type: "expense", category: "Finance Hub", description: form.description, created_at: new Date().toISOString()
        });
      } else if (modal === 'credit') {
        if (!form.customer_id) throw new Error("Customer required");
        await sb.from("cash_book").insert({
          amount, type: "income", category: "Credit Payment", description: `Payment from Customer ID: ${form.customer_id}`, created_at: new Date().toISOString()
        });
        await sb.rpc("decrement_customer_credit", { customer_id: form.customer_id, amount });
      }

      alert("সফলভাবে আপডেট করা হয়েছে!");
      setModal(null);
      setForm({ amount: "", description: "", customer_id: "" });
    } catch (e) {
      alert(e.message || "Error updating finance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-ink">কুইক ফিন্যান্স</h2>
        <div className="grid grid-cols-1 gap-3">
          <button onClick={() => setModal('income')} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm font-medium text-ink transition hover:bg-brand-light hover:text-brand group">
            <Icon name="PlusCircle" size={18} className="text-gray-400 group-hover:text-brand" />
            নতুন ইনকাম যোগ করুন
          </button>
          <button onClick={() => setModal('expense')} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm font-medium text-ink transition hover:bg-brand-light hover:text-brand group">
            <Icon name="MinusCircle" size={18} className="text-gray-400 group-hover:text-brand" />
            খরচ রেকর্ড করুন
          </button>
          <button onClick={() => setModal('credit')} className="flex items-center gap-3 rounded-xl bg-brand p-3 text-sm font-medium text-white transition hover:bg-brand-600 group">
            <Icon name="ArrowDownLeft" size={18} />
            ক্রেডিট পেমেন্ট রিসিভ
          </button>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-ink mb-6">
              {modal === 'income' ? 'ইনকাম যোগ করুন' : modal === 'expense' ? 'খরচ রেকর্ড করুন' : 'ক্রেডিট পেমেন্ট'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">পরিমাণ (৳)</label>
                <input 
                  type="number" 
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" 
                  value={form.amount} 
                  onChange={e => setForm({...form, amount: e.target.value})} 
                />
              </div>
              {modal !== 'credit' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">বিবরণ</label>
                  <input 
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" 
                    value={form.description} 
                    onChange={e => setForm({...form, description: e.target.value})} 
                  />
                </div>
              )}
              {modal === 'credit' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">কাস্টমার আইডি</label>
                  <input 
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" 
                    value={form.customer_id} 
                    onChange={e => setForm({...form, customer_id: e.target.value})} 
                  />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button onClick={() => setModal(null)} className="flex-1 py-2 text-sm font-bold text-gray-400 hover:text-ink transition">বাতিল</button>
                <button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="flex-1 rounded-xl bg-brand py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:bg-gray-300"
                >
                  {loading ? "প্রসেসিং..." : "সেভ করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
