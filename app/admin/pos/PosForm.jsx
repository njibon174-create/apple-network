// app/admin/pos/PosForm.jsx — client POS interface (owner-only).
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPosSale } from "@/app/actions/pos";
import { taka } from "@/lib/data";

const PAYMENTS = [
  { k: "cash", t: "ক্যাশ" },
  { k: "card", t: "কার্ড" },
  { k: "bkash", t: "বিকাশ" },
  { k: "nagad", t: "নগদ" },
  { k: "credit", t: "বাকি (ক্রেডিট)" },
  { k: "emi", t: "EMI" },
];

export default function PosForm({ products }) {
  const router = useRouter();
  const [cart, setCart] = useState([]); // {product_id, name, price, qty, stock}
  const [query, setQuery] = useState("");
  const [payment, setPayment] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [emiMonths, setEmiMonths] = useState("12");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);

  const filtered = products.filter(
    (p) => p.name?.toLowerCase().includes(query.toLowerCase()) || p.brand?.toLowerCase().includes(query.toLowerCase())
  );

  function addToCart(p) {
    setCart((c) => {
      const ex = c.find((x) => x.product_id === p.id);
      if (ex) return c.map((x) => (x.product_id === p.id ? { ...x, qty: x.qty + 1 } : x));
      return [...c, { product_id: p.id, name: p.name, price: p.price_bdt, qty: 1, stock: p.stock }];
    });
  }
  function setQty(id, q) {
    setCart((c) => c.map((x) => (x.product_id === id ? { ...x, qty: Math.max(1, q) } : x)));
  }
  function remove(id) {
    setCart((c) => c.filter((x) => x.product_id !== id));
  }

  const total = cart.reduce((s, x) => s + x.price * x.qty, 0);

  async function submit() {
    if (!cart.length) return setError("পণ্য যোগ করুন");
    setSaving(true);
    setError(null);
    const res = await createPosSale({
      items: cart.map((x) => ({ product_id: x.product_id, qty: x.qty, unit_price_bdt: x.price })),
      payment,
      customer_name: customerName,
      customer_phone: customerPhone,
      due_date: dueDate || null,
      emi_months: emiMonths,
    });
    setSaving(false);
    if (res?.error) setError(res.error);
    else {
      setDone(res.order_number);
      setCart([]);
      router.refresh();
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Product picker */}
      <div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="পণ্য খুঁজুন (নাম/ব্র্যান্ড)"
          className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              <span>
                <span className="font-medium text-ink">{p.name}</span>
                <span className="ml-2 text-xs text-ink-muted">স্টক: {p.stock}</span>
              </span>
              <span className="text-brand">{taka(p.price_bdt)}</span>
            </button>
          ))}
          {!filtered.length && <p className="text-sm text-ink-muted">কোনো পণ্য নেই</p>}
        </div>
      </div>

      {/* Cart + payment */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink">কার্ট</h3>
        {cart.length === 0 && <p className="text-sm text-ink-muted">কার্ট খালি</p>}
        <div className="space-y-1">
          {cart.map((x) => (
            <div key={x.product_id} className="flex items-center gap-2 rounded-lg border border-gray-100 px-2 py-1.5 text-sm">
              <span className="flex-1 truncate text-ink">{x.name}</span>
              <input
                type="number"
                min="1"
                value={x.qty}
                onChange={(e) => setQty(x.product_id, parseInt(e.target.value, 10) || 1)}
                className="w-14 rounded border border-gray-200 px-1 py-0.5 text-center"
              />
              <span className="w-20 text-right text-ink-soft">{taka(x.price * x.qty)}</span>
              <button onClick={() => remove(x.product_id)} className="text-red-500">✕</button>
            </div>
          ))}
        </div>

        <div className="mt-3 text-lg font-bold text-ink">মোট: {taka(total)}</div>

        <div className="mt-3">
          <p className="mb-1 text-xs text-ink-muted">পেমেন্ট পদ্ধতি</p>
          <div className="flex flex-wrap gap-1.5">
            {PAYMENTS.map((p) => (
              <button
                key={p.k}
                onClick={() => setPayment(p.k)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${payment === p.k ? "border-brand bg-brand-light text-brand-700" : "border-gray-200 text-ink-soft"}`}
              >
                {p.t}
              </button>
            ))}
          </div>
        </div>

        {(payment === "credit" || payment === "emi") && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="কাস্টমার নাম" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="ফোন" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            {payment === "credit" && (
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            )}
            {payment === "emi" && (
              <input type="number" value={emiMonths} onChange={(e) => setEmiMonths(e.target.value)} placeholder="মাস (EMI)" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            )}
          </div>
        )}

        {error && <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        {done && <p className="mt-2 rounded-lg bg-green-50 p-2 text-sm text-green-700">সেল সফল: {done}</p>}

        <button
          onClick={submit}
          disabled={saving}
          className="mt-3 w-full rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? "সেল করা হচ্ছে…" : "সেল করুন"}
        </button>
      </div>
    </div>
  );
}
