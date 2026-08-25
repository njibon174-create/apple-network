// app/page.jsx — PAGE 1: Home / Landing
import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import { TrustBadges, CategoryGrid, SectionHeader } from "@/components/ui";
import Icon from "@/components/Icon";
import { getFeatured, getPhones, getByCategory } from "@/lib/store";

export const metadata = {
  title: "Apple Network — New & Used Phones, Accessories & Electronics BD",
  description:
    "Bangladesh's trusted store for new & used phones (official & unofficial), accessories, laptops, tablets & more. Free delivery, EMI up to 36 months, exchange offers.",
};

export default async function HomePage() {
  const [feat, phoneList, acc] = await Promise.all([
    getFeatured(),
    getPhones(),
    getByCategory("accessories"),
  ]);

  return (
    <>
      <HeroCarousel />
      <TrustBadges />
      <CategoryGrid />

      {/* Featured products */}
      <section className="container-x mt-12">
        <SectionHeader title="ফিচারড প্রোডাক্ট" href="/shop" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {feat.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </section>

      {/* Value prop band */}
      <section className="container-x mt-14">
        <div className="grid gap-4 rounded-xl2 bg-ink p-6 text-white sm:grid-cols-3 sm:p-8">
          {[
            ["Sparkles", "নতুন ও পুরানো", "অফিশিয়াল ও আনঅফিশিয়াল — আপনার বাজেট অনুযায়ী বেছে নিন।"],
            ["CreditCard", "সহজ EMI", "২৪+ ব্যাংকে ৩৬ মাস পর্যন্ত কিস্তি, অনেক ক্ষেত্রে ইন্সটলমেন্ট ফ্রি।"],
            ["RefreshCw", "এক্সচেঞ্জ অফার", "পুরানো ফোন দিয়ে নতুনটার দাম কমান — স্বচ্ছ ভ্যালু।"],
          ].map(([ic, t, d]) => (
            <div key={t}>
              <p className="flex items-center gap-2 font-semibold"><Icon name={ic} size={18} className="text-brand" /> {t}</p>
              <p className="mt-1 text-sm text-white/70">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Phones row */}
      <section className="container-x mt-12">
        <SectionHeader title="জনপ্রিয় ফোন" href="/category/phones" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {phoneList.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </section>

      {/* Accessories row */}
      <section className="container-x mt-12">
        <SectionHeader title="অ্যাক্সেসরিজ" href="/category/accessories" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {acc.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </section>

      {/* Services teaser (XafLab) */}
      <section className="container-x mt-14">
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl2 border border-gray-100 bg-brand-light p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="text-sm font-medium text-brand-700">XafLab দ্বারা নির্মিত</p>
            <h3 className="mt-1 text-lg font-bold text-ink">ওয়েবসাইট, অ্যাপ বা সোশ্যাল মিডিয়া সার্ভিস দরকার?</h3>
            <p className="mt-1 text-sm text-ink-soft">XafLab ওয়েব অ্যাপ, মোবাইল অ্যাপ, কাস্টম সফটওয়্যার ও সোশ্যাল মিডিয়া ম্যানেজমেন্ট দেয়।</p>
          </div>
          <Link href="/services" className="btn-primary shrink-0">সার্ভিস দেখুন →</Link>
        </div>
      </section>
    </>
  );
}
