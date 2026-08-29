// app/admin/crm/QuickSellModal.jsx
"use client";
import { useState } from "react";
import { recordDirectSale } from "@/app/actions/crm";
import Icon from "@/components/Icon";

export default function QuickSellModal({ customer, products, onClose }) {
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const res = await recordDirectSale(customer.id, {
      productId: selectedProduct,
      amount: parseFloat(amount),
      paymentMethod: method,
    });

    setLoading(false);
    if (res?.error) {
      setMsg({ type: "error", text: res.error });
    } else {
      setMsg({ type: "success", text: "বিক্রয় সফলভাবে রেকর্ড করা হয়েছে!" });
      setTimeout(() => onClose(), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">কুইক সেল (Direct Sale)</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">প্রোডাক্ট বাছাই করুন</label>
            <select 
              required 
              value={selectedProduct} 
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">-- প্রোডাক্ট বেছে নিন --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} - {p.price_bdt} ৳</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">বিক্রয় মূল্য (৳)</label>
            <input 
              type="number" 
              required 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" 
              placeholder="টাকার পরিমাণ লিখুন"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">পেমেন্ট পদ্ধতি</label>
            <div className="flex gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input 
                  type="radio" 
                  name="method" 
                  value="cash" 
                  checked={method === "cash"} 
                  onChange={(e) => setMethod(e.target.value)}
                  className="accent-brand" 
                /> নগদ (Cash)
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input 
                  type="radio" 
                  name="method" 
                  value="credit" 
                  checked={method === "credit"} 
                  onChange={(e) => setMethod(e.target.value)}
                  className="accent-brand" 
                /> ক্রেডিট (Credit)
              </label>
            </div>
          </div>

          {msg && (
            <div className={`rounded-lg p-3 text-sm ${msg.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
              {msg.text}
            </div>
          )}

          <button 
            disabled={loading} 
            className="btn-primary w-full justify-center py-3"
          >
            {loading ? "প্রসেসিং..." : "বিক্রয় নিশ্চিত করুন"}
          </button>
        </form>
      </div>
    </div>
  );
}
