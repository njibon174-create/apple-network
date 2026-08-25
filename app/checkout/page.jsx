// app/checkout/page.jsx — PAGE 13: Checkout (UI mockup, 4 steps)
"use client";
import Link from "next/link";
import { useState } from "react";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";

const PAYMENTS = [
  { key: "cod", label: "ক্যাশ অন ডেলিভারি", note: "ডেলিভারির সময় পেমেন্ট (সীমিত এলাকায়)" },
  { key: "bkash", label: "bKash / Nagad / Rocket", note: "মোবাইল ব্যাংকিংয়ে সরাসরি পেমেন্ট" },
  { key: "card", label: "ডেবিট / ক্রেডিট কার্ড", note: "সিকিউর পেমেন্ট গেটওয়ে" },
  { key: "emi", label: "EMI (৩৬ মাস পর্যন্ত)", note: "২৪+ ব্যাংক, অনেক ক্ষেত্রে ইন্সটলমেন্ট ফ্রি" },
];

export default function CheckoutPage() {
  const [pay, setPay] = useState("cod");
  const subtotal = 23150, total = 23150;
  return (
    <div className="container-x mt-6">
      <h1 className="text-2xl font-bold text-ink">চেকআউট</h1>
      <p className="mt-1 text-sm text-ink-muted">ঠিকানা দিন, পেমেন্ট বেছে নিন, অর্ডার কনফার্ম করুন।</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Step 1: Address */}
          <Section n="১" title="শিপিং ঠিকানা">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="নাম" placeholder="আপনার নাম" />
              <Input label="ফোন নম্বর" placeholder="০১XXXXXXXXX" />
              <Input label="জেলা" placeholder="ঢাকা" />
              <Input label="থানা / এলাকা" placeholder="এলাকা" />
              <div className="sm:col-span-2">
                <Input label="পূর্ণ ঠিকানা" placeholder="বাড়ি/রোড/ব্লক" />
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
            <textarea rows={3} placeholder="ডেলিভারি সম্পর্কিত কোনো নির্দেশনা…" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand" />
          </Section>
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-xl2 border border-gray-100 p-5">
          <h2 className="font-bold text-ink">অর্ডার রিভিউ</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-ink-soft"><span>Samsung Galaxy A24 ×১</span><span>{taka(22900)}</span></div>
            <div className="flex justify-between text-ink-soft"><span>স্ক্রিন প্রোটেক্টর ×১</span><span>{taka(250)}</span></div>
            <div className="flex justify-between text-ink-soft"><span>ডেলিভারি</span><span className="text-green-600">ফ্রি</span></div>
            <div className="border-t border-gray-100 pt-2">
              <div className="flex justify-between font-bold text-ink"><span>মোট</span><span>{taka(total)}</span></div>
            </div>
          </div>
          <label className="mt-4 flex items-start gap-2 text-xs text-ink-soft">
            <input type="checkbox" className="mt-0.5 accent-brand" />
            <span>আমি <Link href="/terms" className="text-brand">টার্মস অফ সার্ভিস</Link> ও <Link href="/privacy" className="text-brand">প্রাইভেসি পলিসি</Link> পড়েছি।</span>
          </label>
          <button className="btn-primary mt-4 w-full">অর্ডার কনফার্ম করুন</button>
          <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-ink-muted"><Icon name="Lock" size={12} /> আপনার তথ্য নিরাপদ</p>
        </aside>
      </div>
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
function Input({ label, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink-soft">{label}</label>
      <input placeholder={placeholder} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand" />
    </div>
  );
}
