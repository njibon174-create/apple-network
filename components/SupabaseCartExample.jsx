// components/SupabaseCartExample.jsx
// Why: example of how to wire the Supabase browser client into a client component
// (e.g., for live cart sync, auth, order tracking). Not used yet — just reference.

"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useCart(userId, sessionId) {
  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("carts")
        .select("*, cart_items(*)")
        .or(`user_id.eq.${userId},session_id.eq.${sessionId}`)
        .maybeSingle();
      if (data) {
        setCart(data);
        setItems(data.cart_items || []);
      }
      setLoading(false);
    }
    load();

    // Realtime subscription for live cart updates
    const channel = supabase
      .channel("cart-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cart_items", filter: `cart_id=eq.${cart?.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") setItems((prev) => [...prev, payload.new]);
          if (payload.eventType === "DELETE") setItems((prev) => prev.filter((i) => i.id !== payload.old.id));
          if (payload.eventType === "UPDATE")
            setItems((prev) => prev.map((i) => (i.id === payload.new.id ? payload.new : i)));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, sessionId, cart?.id]);

  const addItem = async (productId, { color, storage, ram, condition, qty = 1 }) => {
    if (!cart) return;
    const { error } = await supabase.from("cart_items").upsert(
      { cart_id: cart.id, product_id: productId, color, storage, ram, condition, qty },
      { onConflict: "cart_id,product_id,color,storage,ram,condition" }
    );
    if (error) throw error;
  };

  const updateQty = async (itemId, qty) => {
    if (qty <= 0) {
      await supabase.from("cart_items").delete().eq("id", itemId);
    } else {
      await supabase.from("cart_items").update({ qty }).eq("id", itemId);
    }
  };

  const removeItem = async (itemId) => {
    await supabase.from("cart_items").delete().eq("id", itemId);
  };

  return { cart, items, loading, addItem, updateQty, removeItem };
}

export function useOrderTracking(orderNumber) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("order_number", orderNumber)
        .maybeSingle();
      setOrder(data);
      setLoading(false);
    }
    if (orderNumber) load();
  }, [orderNumber]);

  return { order, loading };
}