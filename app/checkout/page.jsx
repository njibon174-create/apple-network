// app/checkout/page.jsx — Checkout (real order creation via Supabase guest session)
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { taka } from "@/lib/data";
import { useCart } from "@/lib/cart";
import { createOrder } from "@/lib/orders";
import Icon from "@/components/Icon";
import { Loader2, AlertCircle } from "lucide-react";

const PAYMENTS = [
  { key: "cod", label: "ক্যাশ অন ডেলিভারি", note: "ডেলিভারির সময় পেমেন্ট (সীমিত এলাকায়)" },
  { key: "bkash", label: "bKash / Nagad / Rocket", note: "মোবাইল ব্যাংকিংয়ে সরাসরি পেমেন্ট" },
  { key: "card", label: "ডেবিট / ক্রেডিট কার্ড", note: "সিকিউর পেমেন্ট গেটওয়ে" },
  { key: "emi", label: "EMI (৩৬ মাস পর্যন্ত)", note: "২৪+ ব্যাংক, অনেক ক্ষেত্রে ইন্সটলমেন্ট ফ্রি" },
];

const DIVISIONS = ["ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "বরিশাল", "সিলেট", "রংপুর", "ময়মনসিংহ"];

const lineTotal = (i) => i.price * i.qty;
const lineKey = (i) => `${i.slug}-${i.color}-${i.storage}-${i.ram}-${i.condition}`;
const specsOf = (i) => [i.color, i.storage, i.ram, i.condition].filter(Boolean).join(" · ");

export default function CheckoutPage() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal);
  const clear = useCart((s) => s.clear);

  const [pay, setPay] = useState("cod");
  const [agree, setAgree] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", division: "ঢাকা", city: "", address: "", notes: "",
  });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Avoid hydration mismatch — the persisted store hydrates on the client only.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const sub = subtotal();
  const total = sub; // free delivery

  async function handleSubmit(e) {
    e.preventDefault();
    if (items.length === 0) return;
    if (!agree) {
      setError("অনুগ্রহ করে টার্মস অফ সার্ভিস ও প্রাইভেসি পলিসি পড়ে সম্মত হন।");
      return;
    }
    const required = { name: form.name, phone: form.phone, city: form.city, address: form.address };
    const missing = Object.entries(required).filter(([_, v]) => !v.trim());
    if (missing.length) {
      setError("নাম, ফোন নম্বর, জেলা ও পূর্ণ ঠিকানা পূরণ করুন।");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await createOrder({
        items,
        shipping: { ...form, email: form.email.trim() || null, notes: form.notes.trim() || null },
        payment: pay,
      });
      setResult(res);
      setStatus("success");
      clear();
    } catch (err) {
      setError(err?.message || "অর্ডার তৈরি করা যায়নি। পরে আবার চেষ্টা করুন।");
      setStatus("error");
    }
  }

  if (!mounted) {
    return (
      <div className="container-x mt-6">
        <h1 className="text-2xl font-bold text-ink">চেকআউট</h1>
        <p className="mt-6 text-sm text-ink-muted">লোড হচ্ছে…</p>
      </div>
    );
  }

  // Success confirmation (cart already cleared)
  if (status === "success" && result) {
    return (
      <div className="container-x mt-6">
        <div className="mx-auto max-w-xl rounded-xl2 border border-gray-100 p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-light">
            <Icon name="CheckCircle2" size={36} className="text-brand" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink">অর্ডার কনফার্ম হয়েছে!</h1>
          <p className="mt-2 text-sm text-ink-muted">ধন্যবাদ। আপনার অর্ডারটি আমরা পেয়েছি এবং প্রসেস করছি।</p>
          <div className="mt-6 rounded-xl2 border border-gray-100 bg-gray-50 p-4 text-left text-sm">
            <Row label="অর্ডার নম্বর" value={result.orderNumber} bold />
            <Row label="মোট পরিশোধ" value={taka(result.total)} bold />
            <Row label="পেমেন্ট পদ্ধতি" value={PAYMENTS.find((p) => p.key === pay)?.label || pay} />
          </div>
          <p className="mt-4 flex items-center justify-center gap-1 text-xs text-ink-muted">
            <Icon name="Truck" size={13} /> ডেলিভারি আপডেট আপনার ফোনে পাঠানো হবে।
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/shop" className="btn-primary">আরও শপিং করুন →</Link>
            <Link href="/" className="btn-ghost">হোমে ফিরে যান</Link>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart guard
  if (items.length === 0) {
    return (
      <div className="container-x flex min-h-[50vh] flex-col items-center justify-center text-center">
        <Icon name="ShoppingCart" size={56} className="text-ink-muted" />
        <h1 className="mt-4 text-xl font-bold">আপনার কার্ট খালি</h1>
        <p className="mt-2 text-sm text-ink-muted">অর্ডার দিতে প্রথমে কিছু প্রোডাক্ট যোগ করুন।</p>
        <Link href="/shop" className="btn-primary mt-6">শপিং শুরু করুন →</Link>
      </div>
    );
  }

  return (
    <div className="container-x mt-6">
      <h1 className="text-2xl font-bold text-ink">চেকআউট</h1>
      <p className="mt-1 text-sm text-ink-muted">ঠিকানা দিন, পেমেন্ট বেছে নিন, অর্ডার কনফার্ম করুন।</p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Step 1: Address */}
          <Section n="১" title="শিপিং ঠিকানা">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="নাম" value={form.name} onChange={set("name")} placeholder="আপনার নাম" required />
              <Field label="ফোন নম্বর" value={form.phone} onChange={set("phone")} placeholder="০১XXXXXXXXX" required />
              <Field label="ইমেইল (ঐচ্ছিক)" value={form.email} onChange={set("email")} placeholder="you@example.com" type="email" />
              <Field label="জেলা / শহর" value={form.city} onChange={set("city")} placeholder="ঢাকা" required />
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-ink-soft">বিভাগ</label>
                <select
                  value={form.division}
                  onChange={set("division")}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  {DIVISIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Field label="পূর্ণ ঠিকানা" value={form.address} onChange={set("address")} placeholder="বাড়ি/রোড/ব্লক" required />
              </div>
            </div>
          </Section>

          {/* Step 2: Payment */}
          <Section n="২" title="পেমেন্ট পদ্ধতি">
            <div className="space-y-2">
              {PAYMENTS.map((p) => (
                <label key={p.key} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${pay === p.key ? "border-brand bg-brand-light" : "border-gray-200"}`}>
                  <input type="radio" name="pay" checked={pay === p.key} onChange={() => setPay(p.key)} className="mt-1 accent-brand" />
                  <div>
                    <p className="text-sm font-medium text-ink">{p.label}</p>
                    <p className="text-xs text-ink-muted">{p.note}</p>
                  </div>
                </label>
              ))}
            </div>
          </Section>

          {/* Step 3: Notes */}
          <Section n="৩" title="অর্ডার নোট (ঐচ্ছিক)">
            <textarea
              rows={3}
              value={form.notes}
              onChange={set("notes")}
              placeholder="ডেলিভারি সম্পর্কিত কোনো নির্দেশনা…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </Section>
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-xl2 border border-gray-100 p-5">
          <h2 className="font-bold text-ink">অর্ডার রিভিউ</h2>
          <div className="mt-4 space-y-3 text-sm">
            {items.map((i) => (
              <div key={lineKey(i)} className="flex justify-between gap-3 text-ink-soft">
                <span>
                  {i.name}
                  {specsOf(i) && <span className="block text-xs text-ink-muted">{specsOf(i)} × {i.qty.toLocaleString("bn-BD")}</span>}
                </span>
                <span className="shrink-0">{taka(lineTotal(i))}</span>
              </div>
            ))}
            <div className="flex justify-between text-ink-soft"><span>সাবটোটাল</span><span>{taka(sub)}</span></div>
            <div className="flex justify-between text-ink-soft"><span>ডেলিভারি</span><span className="text-green-600">ফ্রি</span></div>
            <div className="border-t border-gray-100 pt-2">
              <div className="flex justify-between font-bold text-ink"><span>মোট</span><span>{taka(total)}</span></div>
            </div>
          </div>

          <label className="mt-4 flex items-start gap-2 text-xs text-ink-soft">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-brand" />
            <span>আমি <Link href="/terms" className="text-brand">টার্মস অফ সার্ভিস</Link> ও <Link href="/privacy" className="text-brand">প্রাইভেসি পলিসি</Link> পড়েছি।</span>
          </label>

          {error && (
            <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              <AlertCircle size={14} /> {error}
            </p>
          )}

          <button type="submit" disabled={status === "loading"} className="btn-primary mt-4 w-full disabled:opacity-60">
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> প্রসেস হচ্ছে…</span>
            ) : "অর্ডার কনফার্ম করুন"}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-ink-muted"><Icon name="Lock" size={12} /> আপনার তথ্য নিরাপদ</p>
        </aside>
      </form>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-ink-muted">{label}</span>
      <span className={bold ? "font-bold text-ink" : "text-ink-soft"}>{value}</span>
    </div>
  );
}

function Section({ n, title, children }) {
  return (
    <div className="rounded-xl2 border border-gray-100 p-5">
      <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-sm text-white">{n}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required, type = "text" }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink-soft">
        {label}{required && <span className="text-brand"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
    </div>
  );
}
