// components/ProductDetail.jsx
// Why: interactive client component for the product page — selectable variants
// (color / storage / RAM / condition), image gallery, add-to-cart. Uses useState so
// selections actually respond to clicks.
"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";
import { useCart } from "@/lib/cart";

export default function ProductDetail({ p }) {
  // Build variant option lists from the product (with sensible sample fallbacks).
  const colors = p.colors || [p.color, "সিলভার", "ব্লু", "গোল্ড"].filter(Boolean);
  const storages = p.storages || [p.storage, "256GB", "512GB"].filter(Boolean);
  const rams = p.rams || [p.ram, "8GB", "12GB"].filter(Boolean);
  // Tags derived from the product (not user-selectable):
  //   - New/Used from condition enum
  //   - Official/Unofficial from official flag
  const isUsed = p.condition && p.condition.startsWith("used");
  const newUsedTag = isUsed ? "প্রিলাভড" : "নতুন";
  const officialTag = p.official ? "অফিশিয়াল" : "আনঅফিশিয়াল";

  // De-dupe while preserving order (first item is the product's own value = default).
  const uniq = (arr) => [...new Set(arr)];

  const [color, setColor] = useState(colors[0]);
  const [storage, setStorage] = useState(storages[0]);
  const [ram, setRam] = useState(rams[0]);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const add = useCart((s) => s.add);

  const off = p.regularPrice ? Math.round((1 - p.price / p.regularPrice) * 100) : 0;
  const gallery = [p.image, p.image, p.image, p.image]; // same asset repeated until per-variant photos exist

  const addToCart = () => {
    add({
      slug: p.slug,
      name: p.name,
      price: p.price,
      image: p.image,
      color,
      storage,
      ram,
      condition: p.condition,
      qty: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Gallery */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-xl2 bg-gray-50">
          <Image src={gallery[activeImg] || "/images/products/samsung.png"} alt={p.name} fill sizes="(max-width:1024px) 100vw, 50vw" className="object-contain p-6" priority />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {gallery.map((g, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-gray-50 ${activeImg === i ? "border-brand" : "border-transparent"}`}
              aria-label={`ছবি ${i + 1}`}
            >
              <Image src={g || "/images/products/samsung.png"} alt="" fill sizes="15vw" className="object-contain p-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div>
        <p className="text-sm text-ink-muted">{p.brand}</p>
        <h1 className="text-2xl font-bold text-ink">{p.name}</h1>
        <div className="mt-1 flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 text-accent-yellow">
            <Icon name="Star" size={14} className="fill-accent-yellow text-accent-yellow" /> {(p.rating || 0).toLocaleString("bn-BD")}
          </span>
          <span className="text-ink-muted">({(p.reviews || 0).toLocaleString("bn-BD")} রিভিউ)</span>
          <span className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${p.inStock ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
            {p.inStock ? "স্টকে আছে" : "প্রি-অর্ডার"}
          </span>
        </div>

        {/* Price */}
        <div className="mt-4 flex items-end gap-3">
          <span className="text-3xl font-bold text-brand">{taka(p.price)}</span>
          {p.regularPrice && <span className="text-lg text-ink-muted line-through">{taka(p.regularPrice)}</span>}
          {off > 0 && <span className="badge-off mb-1">-{off}% ছাড়</span>}
        </div>
        {p.emiFrom && (
          <p className="mt-1 flex items-center gap-1 text-sm text-accent-teal">
            <Icon name="CreditCard" size={14} /> EMI ৳{p.emiFrom.toLocaleString("bn-BD")}/মাস থেকে (৩৬ মাস পর্যন্ত)
          </p>
        )}

        {/* Interactive variant selectors */}
        <div className="mt-5 space-y-4">
          <VariantRow label="রং" options={uniq(colors)} value={color} onChange={setColor} />
          {p.category === "phones" && (
            <>
              <VariantRow label="স্টোরেজ" options={uniq(storages)} value={storage} onChange={setStorage} />
              <VariantRow label="RAM" options={uniq(rams)} value={ram} onChange={setRam} />
            </>
          )}
        </div>

        {/* Tags: New/Used + Official/Unofficial */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${isUsed ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
            <Icon name={isUsed ? "RefreshCw" : "Sparkles"} size={13} /> {newUsedTag}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${p.official ? "bg-brand-light text-brand-700" : "bg-gray-100 text-ink-soft"}`}>
            <Icon name="BadgeCheck" size={13} /> {officialTag}
          </span>
        </div>

        {/* Selected summary — proves the selection is live */}
        <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-ink-soft">
          নির্বাচিত: <span className="font-medium text-ink">{color}</span>
          {p.category === "phones" && <> · <span className="font-medium text-ink">{storage}</span> · <span className="font-medium text-ink">{ram}</span></>}
        </div>

        {/* CTAs */}
        <div className="mt-6 flex gap-3">
          <button onClick={addToCart} className="btn-primary flex-1">
            <Icon name={added ? "CheckCircle2" : "ShoppingCart"} size={18} /> {added ? "যোগ হয়েছে!" : "কার্টে যোগ করুন"}
          </button>
          <Link href="/checkout" className="btn-secondary flex-1"><Icon name="Zap" size={18} /> এখনই কিনুন</Link>
        </div>

        {/* Trust row */}
        <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-ink-soft sm:grid-cols-4">
          {[["BadgeCheck", "১০০% অথেন্টিক"], ["Truck", "ফ্রি ডেলিভারি"], ["RefreshCw", "এক্সচেঞ্জ"], ["ShieldCheck", "ওয়ারেন্টি"]].map(([ic, t]) => (
            <div key={t} className="flex items-center gap-1.5 rounded-lg bg-gray-50 p-2">
              <Icon name={ic} size={14} className="text-brand" /> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// A single selectable variant row. Clicking an option updates state and highlights it.
function VariantRow({ label, options, value, onChange }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-ink-soft">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o === value;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              aria-pressed={active}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                active
                  ? "border-brand bg-brand-light font-medium text-brand-700"
                  : "border-gray-200 text-ink-soft hover:border-brand/50"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
