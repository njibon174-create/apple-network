// app/cart/page.jsx — Shopping Cart (live cart store)
"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { taka } from "@/lib/data";
import { useCart } from "@/lib/cart";
import Icon from "@/components/Icon";

export default function CartPage() {
  // Live cart store (zustand, persisted to localStorage).
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const subtotal = useCart((s) => s.subtotal);
  const count = useCart((s) => s.count);

  const [promo, setPromo] = useState(false);

  // Avoid hydration mismatch: the persisted store hydrates on the client only.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dec = (it) => setQty(it, it.qty - 1);
  const inc = (it) => setQty(it, it.qty + 1);

  const sub = subtotal();
  const discount = promo ? 2000 : 0;
  const total = sub - discount;

  if (!mounted) {
    return (
      <div className="container-x mt-6">
        <h1 className="text-2xl font-bold text-ink">আপনার কার্ট</h1>
        <p className="mt-6 text-sm text-ink-muted">লোড হচ্ছে…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-x flex min-h-[50vh] flex-col items-center justify-center text-center">
        <Icon name="ShoppingCart" size={56} className="text-ink-muted" />
        <h1 className="mt-4 text-xl font-bold">আপনার কার্ট খালি</h1>
        <p className="mt-2 text-sm text-ink-muted">কিছু প্রোডাক্ট যোগ করে শপিং শুরু করুন।</p>
        <Link href="/shop" className="btn-primary mt-6">শপিং শুরু করুন →</Link>
      </div>
    );
  }

  return (
    <div className="container-x mt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">আপনার কার্ট ({count()})</h1>
        <button onClick={clear} className="text-xs text-ink-muted hover:text-red-500 hover:underline">কার্ট ক্লিয়ার</button>
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((it) => {
            const specs = [it.color, it.storage, it.ram, it.condition].filter(Boolean).join(" · ");
            return (
              <div key={`${it.slug}-${it.color}-${it.storage}-${it.ram}-${it.condition}`} className="flex gap-4 rounded-xl2 border border-gray-100 p-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                  <Image src={it.image} alt={it.name} fill sizes="80px" className="object-contain p-1.5" />
                </div>
                <div className="flex flex-1 flex-col">
                  <h3 className="text-sm font-semibold text-ink">{it.name}</h3>
                  {specs && <p className="mt-0.5 text-xs text-ink-muted">{specs}</p>}
                  <p className="text-sm font-bold text-brand">{taka(it.price)}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => dec(it)} className="grid h-7 w-7 place-items-center rounded-md bg-gray-100 font-bold">−</button>
                      <span className="w-6 text-center text-sm">{it.qty.toLocaleString("bn-BD")}</span>
                      <button onClick={() => inc(it)} className="grid h-7 w-7 place-items-center rounded-md bg-gray-100 font-bold">+</button>
                    </div>
                    <button onClick={() => remove(it)} className="text-xs text-red-500 hover:underline">রিমুভ</button>
                  </div>
                </div>
              </div>
            );
          })}
          <Link href="/shop" className="inline-block text-sm font-medium text-brand hover:underline">← শপিং চালিয়ে যান</Link>
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-xl2 border border-gray-100 p-5">
          <h2 className="font-bold text-ink">অর্ডার সামারি</h2>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="সাবটোটাল" value={taka(sub)} />
            <Row label="ডেলিভারি" value="ফ্রি" green />
            {promo && <Row label="প্রমো ডিসকাউন্ট" value={`−${taka(discount)}`} green />}
            <div className="border-t border-gray-100 pt-2">
              <Row label="মোট" value={taka(total)} bold />
            </div>
            <p className="text-xs text-accent-teal">EMI: ৳{Math.round(total / 12).toLocaleString("bn-BD")}/মাস × ১২ মাস থেকে</p>
          </div>
          {!promo && (
            <div className="mt-4 flex gap-2">
              <input placeholder="প্রমো কোড" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none" />
              <button onClick={() => setPromo(true)} className="btn-ghost text-sm">এপ্লাই</button>
            </div>
          )}
          <Link href="/checkout" className="btn-primary mt-4 w-full">চেকআউটে যান →</Link>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs text-ink-muted">
            <span className="flex items-center justify-center gap-1 rounded bg-gray-50 p-2"><Icon name="Lock" size={13} /> নিরাপদ পেমেন্ট</span>
            <span className="flex items-center justify-center gap-1 rounded bg-gray-50 p-2"><Icon name="Truck" size={13} /> ফ্রি ডেলিভারি</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, bold, green }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "font-bold text-ink" : "text-ink-soft"}>{label}</span>
      <span className={`${bold ? "font-bold text-ink" : ""} ${green ? "text-green-600" : ""}`}>{value}</span>
    </div>
  );
}
