// lib/cart.js
// Why: client-side cart store. Persists to localStorage for instant UI, and syncs
// line items to Supabase (guest session_id) so checkout can create a real order.
// Used by ProductDetail (add), Cart page (edit), Checkout (submit), Header (count).

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Stable guest session id (survives reloads, no login needed). RLS on carts/cart_items
// allows writes when session_id matches this value.
function getSessionId() {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("an_session_id");
  if (!id) {
    id = "guest_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("an_session_id", id);
  }
  return id;
}

export const useCart = create(
  persist(
    (set, get) => ({
      items: [], // { slug, name, price, image, color, storage, ram, condition, qty }
      add: (item) => {
        const items = [...get().items];
        const idx = items.findIndex(
          (i) =>
            i.slug === item.slug &&
            i.color === item.color &&
            i.storage === item.storage &&
            i.ram === item.ram &&
            i.condition === item.condition
        );
        if (idx >= 0) {
          items[idx] = { ...items[idx], qty: items[idx].qty + (item.qty || 1) };
        } else {
          items.push({ qty: 1, ...item });
        }
        set({ items });
      },
      setQty: (key, qty) =>
        set({
          items: get().items.map((i) =>
            i.slug === key.slug && i.color === key.color && i.storage === key.storage &&
            i.ram === key.ram && i.condition === key.condition
              ? { ...i, qty: Math.max(1, qty) }
              : i
          ),
        }),
      remove: (key) =>
        set({
          items: get().items.filter(
            (i) =>
              !(
                i.slug === key.slug && i.color === key.color && i.storage === key.storage &&
                i.ram === key.ram && i.condition === key.condition
              )
          ),
        }),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
    }),
    { name: "an_cart" }
  )
);

export { getSessionId };
