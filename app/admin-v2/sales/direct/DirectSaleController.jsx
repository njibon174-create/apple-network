// app/admin-v2/sales/direct/DirectSaleController.jsx
"use client";
import { useState, useEffect } from "react";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";

export default function DirectSaleController({ initialProducts, initialCustomers }) {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "+880" });
  const [discount, setDiscount] = useState(0);
  const [downPayment, setDownPayment] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const filtered = initialProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.name_bn?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10);
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [searchQuery, initialProducts]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setSearchQuery("");
    setFilteredProducts([]);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    ));
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const calculateGrossTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price_bdt * item.qty), 0);
  };

  const calculateNetTotal = () => {
    const gross = calculateGrossTotal();
    return Math.max(0, gross - discount);
  };

  const handleSale = async () => {
    setIsLoading(true);
    try {
      const sb = createClient();
      const netTotal = calculateNetTotal();

      // 1. Record Income (Down payment or full cash)
      const actualIncome = paymentMethod === 'cash' ? netTotal : parseFloat(downPayment || 0);
      
      if (actualIncome > 0) {
        await sb.from("cash_transactions").insert({
          type: "sale",
          amount_bdt: actualIncome,
          category: "Direct Sale",
          description: `Direct Sale to ${selectedCustomer ? 'Customer ID: ' + selectedCustomer : 'Walk-in'}. Total: ${taka(netTotal)}, Paid: ${taka(actualIncome)}`,
          created_at: new Date().toISOString(),
        });
      }

      // 2. Update Stock for each item
      for (const item of cart) {
        await sb.from("stock_ledger").insert({
          product_id: item.id,
          qty: -item.qty,
          type: "sale",
          created_at: new Date().toISOString(),
        });
      }

      // 3. Credit handling
      if (paymentMethod === "credit" && selectedCustomer) {
        const creditAmount = netTotal - parseFloat(downPayment || 0);
        if (creditAmount > 0) {
          await sb.from("credit_sales").insert({
            customer_id: selectedCustomer,
            amount: creditAmount,
            created_at: new Date().toISOString(),
          });
          
          // We assume a Supabase RPC exists for updating the total outstanding
          await sb.rpc("increment_customer_credit", { 
            customer_id: selectedCustomer, 
            amount: creditAmount 
          });
        }
      }

      alert("বিক্রয় সফলভাবে সম্পন্ন হয়েছে!");
      setCart([]);
      setSelectedCustomer("");
      setDiscount(0);
      setDownPayment(0);
    } catch (e) {
      console.error(e);
      alert("Error completing sale");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCustomer = async () => {
    if (!newCustomer.name || newCustomer.phone.length < 12) return;
    try {
      const sb = createClient();
      const { data, error } = await sb.from("customers").insert({
        name: newCustomer.name,
        phone: newCustomer.phone,
        type: paymentMethod === 'credit' ? 'credit' : 'walk-in'
      }).select().single();
      
      if (error) throw error;
      setSelectedCustomer(data.id);
      setIsAddingCustomer(false);
      setNewCustomer({ name: "", phone: "+880" });
    } catch (e) {
      alert("Customer creation failed");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Product Search & Cart - Takes 2 columns */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
          {/* Product Search */}
          <div className="relative">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">প্রোডাক্ট সার্চ করুন</label>
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 text-sm outline-none focus:border-brand transition-all" 
                placeholder="প্রোডাক্টের নাম বা মডেল লিখুন..."
              />
              <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Search Results Dropdown */}
            {filteredProducts.length > 0 && (
              <div className="absolute z-50 w-full mt-1 rounded-xl border border-gray-100 bg-white shadow-2xl overflow-hidden">
                {filteredProducts.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => addToCart(p)}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{p.name}</p>
                        <p className="text-[10px] text-gray-400">৳{p.price_bdt}</p>
                      </div>
                    </div>
                    <div className="text-brand text-xs font-bold">+ যোগ করুন</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink uppercase">কার্ট আইটেমস</h3>
              <span className="text-xs font-medium text-gray-400">{cart.length} টি আইটেম</span>
            </div>

            {cart.length > 0 ? (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink">{item.name}</p>
                      <p className="text-xs text-gray-400">{taka(item.price_bdt)} / পিস</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-1">
                        <button onClick={() => updateQty(item.id, -1)} className="h-6 w-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-ink">-</button>
                        <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="h-6 w-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-ink">+</button>
                      </div>
                      <p className="text-sm font-bold text-ink w-20 text-right">{taka(item.price_bdt * item.qty)}</p>
                      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600">
                        <Icon name="Trash" size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl border border-dashed border-gray-200">
                <Icon name="ShoppingCart" size={32} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">কার্ট খালি। প্রোডাক্ট সার্চ করে যোগ করুন।</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Customer & Payment Panel */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-ink uppercase">পেমেন্ট এবং কাস্টমার</h3>
          
          {/* Customer Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-400 uppercase">কাস্টমার নির্বাচন</label>
            {!isAddingCustomer ? (
              <div className="flex gap-2">
                <select 
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
                >
                  <option value="">Walk-in Customer</option>
                  {initialCustomers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                </select>
                <button 
                  onClick={() => setIsAddingCustomer(true)}
                  className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-brand hover:text-white transition-colors"
                  title="নতুন কাস্টমার যোগ করুন"
                >
                  <Icon name="Plus" size={18} />
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <input 
                  placeholder="নাম" 
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" 
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">+880</span>
                  <input 
                    placeholder="১৭XXXXXXXX" 
                    maxLength={11}
                    className="w-full rounded-lg border border-gray-200 pl-12 pr-3 py-2 text-sm" 
                    value={newCustomer.phone.replace("+880", "")}
                    onChange={e => setNewCustomer({...newCustomer, phone: "+880" + e.target.value.slice(0, 11)})}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleQuickCustomer} className="flex-1 py-2 bg-brand text-white text-xs font-bold rounded-lg">সেভ করুন</button>
                  <button onClick={() => setIsAddingCustomer(false)} className="flex-1 py-2 bg-gray-200 text-gray-600 text-xs font-bold rounded-lg">বাতিল</button>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-400 uppercase">পেমেন্ট পদ্ধতি</label>
            <div className="flex gap-3">
              <button 
                onClick={() => setPaymentMethod("cash")}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${paymentMethod === 'cash' ? 'bg-brand text-white border-brand shadow-md' : 'bg-white text-gray-500 border-gray-200'}`}
              >
                নগদ (Cash)
              </button>
              <button 
                onClick={() => setPaymentMethod("credit")}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${paymentMethod === 'credit' ? 'bg-brand text-white border-brand shadow-md' : 'bg-white text-gray-500 border-gray-200'}`}
              >
                বাকি (Credit)
              </button>
            </div>
          </div>

          {/* Adjustments Section */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase">ডিসকাউন্ট (৳)</label>
                <input 
                  type="number" 
                  value={discount}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" 
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase">ডাউন পেমেন্ট (৳)</label>
                <input 
                  type="number" 
                  value={downPayment}
                  onChange={e => setDownPayment(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" 
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Total & Final Action */}
          <div className="pt-6 border-t border-gray-100 space-y-4">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">গ্রস টোটাল: {taka(calculateGrossTotal())}</p>
                <p className="text-[10px] font-bold text-red-400 uppercase">ডিসকাউন্ট: -{taka(discount)}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-gray-400 uppercase block">নেট মোট</span>
                <span className="text-3xl font-bold text-ink">{taka(calculateNetTotal())}</span>
              </div>
            </div>
            <button 
              disabled={cart.length === 0 || isLoading || (paymentMethod === 'credit' && !selectedCustomer)}
              onClick={handleSale}
              className="w-full rounded-xl bg-brand py-4 text-sm font-bold text-white transition hover:bg-brand-600 shadow-lg shadow-brand/20 disabled:bg-gray-300 disabled:shadow-none"
            >
              {isLoading ? "প্রসেসিং..." : "বিক্রয় সম্পন্ন করুন"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
