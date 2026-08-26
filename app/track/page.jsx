// app/track/page.jsx — PAGE 14: Order Tracking (real lookup via Supabase)
"use client";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import { getOrderByNumber } from "@/lib/orders";
import { taka } from "@/lib/data";

const STAGES = [
  { key: "new", label: "অর্ডার গ্রহণ", icon: "ShoppingBag", desc: "অর্ডারটি পাওয়া গেছে" },
  { key: "calling", label: "যাচাই করা হচ্ছে", icon: "Phone", desc: "আমরা আপনাকে কল করছি" },
  { key: "confirmed", label: "কনফার্ম করা হয়েছে", icon: "CheckCircle2", desc: "অর্ডার নিশ্চিত করা হয়েছে" },
  { key: "preparing", label: "প্রস্তুতি", icon: "Package", desc: "প্যাক ও চেক করা হচ্ছে" },
  { key: "shipping", label: "পথে", icon: "Truck", desc: "ডেলিভারি পার্টনারের কাছে" },
  { key: "delivered", label: "ডেলিভার করা হয়েছে", icon: "Home", desc: "পৌঁছে গেছে" },
];

const STATUS_LABEL = {
  new: "নতুন অর্ডার",
  calling: "কল করা হচ্ছে",
  confirmed: "কনফার্ম করা হয়েছে",
  preparing: "প্রস্তুতি চলছে",
  shipping: "পথে আছে",
  delivered: "ডেলিভার করা হয়েছে",
  cancelled: "বাতিল করা হয়েছে",
};

// which timeline stage is "current" for each status
const STATUS_INDEX = { new: 0, calling: 1, confirmed: 2, preparing: 3, shipping: 4, delivered: 5 };

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="container-x mt-10 text-center text-ink-muted">লোড হচ্ছে…</div>}>
      <TrackPageInner />
    </Suspense>
  );
}

function TrackPageInner() {
  const params = useSearchParams();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null); // found order row, or null
  const [notFound, setNotFound] = useState(false);

  // Auto-lookup if an order number is passed via ?n=AN-xxxx (from checkout success link)
  useEffect(() => {
    const n = params.get("n");
    if (n) {
      setValue(n);
      (async () => {
        setLoading(true);
        const result = await getOrderByNumber(n);
        setLoading(false);
        if (result) setOrder(result);
        else setNotFound(true);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleTrack(e) {
    e?.preventDefault();
    const num = value.trim();
    if (!num) return;
    setLoading(true);
    setOrder(null);
    setNotFound(false);
    const result = await getOrderByNumber(num);
    setLoading(false);
    if (result) setOrder(result);
    else setNotFound(true);
  }

  const cancelled = order?.status === "cancelled";
  const current = order ? STATUS_INDEX[order.status] ?? 0 : 0;

  return (
    <div className="container-x mt-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-ink">অর্ডার ট্র্যাক করুন</h1>
      <p className="mt-1 text-sm text-ink-muted">অর্ডার আইডি দিয়ে আপনার অর্ডারের অবস্থা দেখুন।</p>

      <form onSubmit={handleTrack} className="mt-6 flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="অর্ডার আইডি (যেমন AN-12345)"
          className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand"
        />
        <button type="submit" disabled={loading} className="btn-primary shrink-0">
          {loading ? "অনুসন্ধান..." : "ট্র্যাক"}
        </button>
      </form>

      {notFound && (
        <div className="mt-8 rounded-xl2 border border-gray-100 p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gray-100 text-ink-muted">
            <Icon name="Search" size={22} />
          </div>
          <p className="mt-3 font-semibold text-ink">কোনো অর্ডার পাওয়া যায়নি</p>
          <p className="mt-1 text-sm text-ink-muted">
            আইডিটি সঠিক কিনা পরীক্ষা করুন (যেমন AN-12345)।
          </p>
        </div>
      )}

      {order && (
        <div className="mt-8 rounded-xl2 border border-gray-100 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-muted">অর্ডার আইডি</p>
              <p className="font-bold text-ink">{order.order_number}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                cancelled ? "bg-red-100 text-red-700" : "bg-brand-light text-brand-700"
              }`}
            >
              {STATUS_LABEL[order.status] || order.status}
            </span>
          </div>

          {cancelled ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              এই অর্ডারটি বাতিল করা হয়েছে। বিস্তারিত জানতে{" "}
              <Link href="/contact" className="font-medium underline">
                আমাদের সাথে যোগাযোগ করুন
              </Link>
              ।
            </div>
          ) : (
            <div className="space-y-0">
              {(() => {
                // Map each status-log entry's to_status -> the note shown at that stage.
                const logByStatus = {};
                (order.order_status_log || []).forEach((l) => {
                  if (l.to_status) logByStatus[l.to_status] = l;
                });
                return STAGES.map((s, i) => {
                  const done = i <= current;
                  const note = logByStatus[s.key];
                  return (
                    <div key={s.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`grid h-10 w-10 place-items-center rounded-full ${
                            done ? "bg-brand text-white" : "bg-gray-100 text-ink-muted"
                          }`}
                        >
                          <Icon name={s.icon} size={18} />
                        </div>
                        {i < STAGES.length - 1 && (
                          <div className={`h-10 w-0.5 ${i < current ? "bg-brand" : "bg-gray-200"}`} />
                        )}
                      </div>
                      <div className={`pb-6 ${done ? "" : "opacity-50"}`}>
                        <p className="font-semibold text-ink">{s.label}</p>
                        <p className="text-sm text-ink-muted">{s.desc}</p>
                        {note?.note && (
                          <p className="mt-1 rounded-lg bg-gray-50 px-3 py-2 text-sm text-ink-soft">
                            📝 {note.note}
                            <span className="ml-2 text-xs text-ink-muted">
                              {new Date(note.created_at).toLocaleString("bn-BD")}
                            </span>
                          </p>
                        )}
                        {i === current && (
                          <p className="mt-1 text-xs text-brand">আনুমানিক ডেলিভারি: ১–২ দিন</p>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {order.order_status_log?.length > 0 && (
            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <p className="mb-2 text-xs font-medium uppercase text-ink-muted">আপডেট হিস্টোরি</p>
              <ul className="space-y-1.5 text-sm">
                {order.order_status_log
                  .slice()
                  .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                  .map((l) => (
                    <li key={l.id} className="flex items-start gap-2 text-ink-soft">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-brand" />
                      <span>
                        {l.note || l.to_status}
                        <span className="ml-2 text-xs text-ink-muted">
                          {new Date(l.created_at).toLocaleString("bn-BD")}
                        </span>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">মোট</span>
              <span className="font-semibold text-ink">{taka(order.total_bdt)}</span>
            </div>
            {order.shipping_name && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">প্রাপক</span>
                <span className="font-medium text-ink">{order.shipping_name}</span>
              </div>
            )}
            {order.created_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">অর্ডারের তারিখ</span>
                <span className="font-medium text-ink">
                  {new Date(order.created_at).toLocaleDateString("bn-BD")}
                </span>
              </div>
            )}
            {order.order_items?.length > 0 && (
              <div className="pt-2">
                <p className="mb-2 text-xs font-medium uppercase text-ink-muted">পণ্যসমূহ</p>
                <ul className="space-y-2">
                  {order.order_items.map((it, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm">
                      <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-gray-100 text-ink-muted">
                        <Icon name="Package" size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">{it.product_name}</p>
                        {(it.color || it.storage || it.ram) && (
                          <p className="text-xs text-ink-muted">
                            {[it.color, it.storage, it.ram].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <span className="text-ink-muted">×{it.qty}</span>
                      <span className="font-medium text-ink">{taka(it.unit_price_bdt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-center text-sm text-ink-soft">
            কোনো সমস্যা?{" "}
            <Link href="/contact" className="font-medium text-brand">
              আমাদের সাথে চ্যাট করুন
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
