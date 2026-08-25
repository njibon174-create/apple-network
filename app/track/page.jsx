// app/track/page.jsx — PAGE 14: Order Tracking (interactive mockup)
"use client";
import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";

const STAGES = [
  { key: "confirmed", label: "কনফার্ম করা হয়েছে", icon: "CheckCircle2", desc: "অর্ডার গ্রহণ করা হয়েছে" },
  { key: "preparing", label: "প্রস্তুতি", icon: "Package", desc: "প্যাক ও চেক করা হচ্ছে" },
  { key: "shipping", label: "পথে", icon: "Truck", desc: "ডেলিভারি পার্টনারের কাছে" },
  { key: "delivered", label: "ডেলিভার করা হয়েছে", icon: "Home", desc: "পৌঁছে গেছে" },
];

export default function TrackPage() {
  const [tracked, setTracked] = useState(false);
  const current = 2; // sample: "on the way"

  return (
    <div className="container-x mt-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-ink">অর্ডার ট্র্যাক করুন</h1>
      <p className="mt-1 text-sm text-ink-muted">অর্ডার আইডি দিয়ে আপনার অর্ডারের অবস্থা দেখুন।</p>

      <div className="mt-6 flex gap-2">
        <input defaultValue="AN-12345" placeholder="অর্ডার আইডি (যেমন AN-12345)" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand" />
        <button onClick={() => setTracked(true)} className="btn-primary shrink-0">ট্র্যাক</button>
      </div>

      {tracked && (
        <div className="mt-8 rounded-xl2 border border-gray-100 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-muted">অর্ডার আইডি</p>
              <p className="font-bold text-ink">AN-12345</p>
            </div>
            <span className="rounded-full bg-brand-light px-3 py-1 text-sm font-medium text-brand-700">পথে আছে</span>
          </div>
          {/* Progress */}
          <div className="space-y-0">
            {STAGES.map((s, i) => {
              const done = i <= current;
              return (
                <div key={s.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`grid h-10 w-10 place-items-center rounded-full ${done ? "bg-brand text-white" : "bg-gray-100 text-ink-muted"}`}><Icon name={s.icon} size={18} /></div>
                    {i < STAGES.length - 1 && <div className={`h-10 w-0.5 ${i < current ? "bg-brand" : "bg-gray-200"}`} />}
                  </div>
                  <div className={`pb-6 ${done ? "" : "opacity-50"}`}>
                    <p className="font-semibold text-ink">{s.label}</p>
                    <p className="text-sm text-ink-muted">{s.desc}</p>
                    {i === current && <p className="mt-1 text-xs text-brand">আনুমানিক ডেলিভারি: ১–২ দিন</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-center text-sm text-ink-soft">
            কোনো সমস্যা? <Link href="/contact" className="font-medium text-brand">আমাদের সাথে চ্যাট করুন</Link>
          </div>
        </div>
      )}
    </div>
  );
}
