// components/HeroCarousel.jsx
// Why: homepage hero with auto-rotating promo banners using real photography.
"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

const SLIDES = [
  { img: "/images/hero/phones.png", eyebrow: "নতুন ও পুরানো ফোন", title: "আপনার পরবর্তী ফোন — বিশ্বস্ত দামে", sub: "অফিশিয়াল ও আনঅফিশিয়াল · ৩৬ মাস EMI · ফ্রি ডেলিভারি", cta: "সব ফোন দেখুন", href: "/category/phones" },
  { img: "/images/hero/used.png", eyebrow: "প্রিলাভড কালেকশন", title: "কম দামে যাচাই করা ফোন", sub: "স্বচ্ছ গ্রেডিং — Excellent, Good, Fair · ব্যাটারি হেলথ যাচাই করা", cta: "প্রিলাভড দেখুন", href: "/category/phones" },
  { img: "/images/hero/accessories.png", eyebrow: "অ্যাক্সেসরিজ", title: "আপনার সেটআপ সম্পূর্ণ করুন", sub: "চার্জার, ইয়ারবাডস, কেস, পাওয়ার ব্যাংক — আসল প্রোডাক্ট", cta: "অ্যাক্সেসরিজ দেখুন", href: "/category/accessories" },
];

export default function HeroCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);
  const s = SLIDES[i];
  return (
    <section className="container-x pt-4">
      <div className="relative aspect-[21/9] overflow-hidden rounded-xl2 sm:aspect-[3/1]">
        {/* Real hero images, cross-faded */}
        {SLIDES.map((slide, k) => (
          <Image
            key={slide.img}
            src={slide.img}
            alt={slide.title}
            fill
            priority={k === 0}
            sizes="100vw"
            className={`object-cover transition-opacity duration-700 ${k === i ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        {/* Left-to-right dark scrim so text is always readable over the photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

        {/* Text overlay */}
        <div className="absolute inset-0 flex flex-col justify-center px-6 text-white sm:px-10">
          <div className="max-w-lg">
            <p className="text-xs font-medium opacity-90 sm:text-sm">{s.eyebrow}</p>
            <h1 className="mt-2 text-xl font-bold leading-tight sm:text-4xl">{s.title}</h1>
            <p className="mt-2 text-xs opacity-90 sm:mt-3 sm:text-base">{s.sub}</p>
            <Link href={s.href} className="mt-4 inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 sm:mt-6 sm:px-6 sm:py-3">
              {s.cta} →
            </Link>
          </div>
        </div>

        {/* Dots */}
        <div className="absolute bottom-4 left-6 flex gap-2 sm:left-10">
          {SLIDES.map((_, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              className={`h-2 rounded-full transition-all ${k === i ? "w-6 bg-white" : "w-2 bg-white/50"}`}
              aria-label={`স্লাইড ${k + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
