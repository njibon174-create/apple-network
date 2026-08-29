// app/admin-v2/customers/Customer360Wrapper.jsx
"use client";
import { useState } from "react";
import QuickSellModal from "./QuickSellModal";

export default function Customer360Wrapper({ customer, products, children }) {
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);

  return (
    <>
      {/* We wrap the server component children and provide the modal trigger */}
      <div className="relative">
        {children}
      </div>

      {isSellModalOpen && (
        <QuickSellModal 
          customer={customer} 
          products={products} 
          onClose={() => setIsSellModalOpen(false)} 
        />
      )}
      
      {/* Floating Quick Sell Button for better UX */}
      <button 
        onClick={() => setIsSellModalOpen(true)}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-2xl transition-all hover:scale-105 hover:bg-brand-600 active:scale-95"
      >
        <span className="text-lg">⚡</span> কুইক সেল (Quick Sell)
      </button>
    </>
  );
}
