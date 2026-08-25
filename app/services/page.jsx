// app/services/page.jsx — PAGE 8: Services — Software Solutions (XafLab)
import Link from "next/link";
import { PageHero } from "@/components/ui";
import Icon from "@/components/Icon";

export const metadata = {
  title: "Software Solutions — Web, Mobile & Custom Apps | XafLab",
  description: "XafLab delivers custom software in Bangladesh — web apps, mobile apps (Android & iOS) and bespoke solutions for businesses and startups. Get a quote.",
};

const SERVICES = [
  { icon: "Globe", title: "ওয়েব অ্যাপ্লিকেশন", items: ["বিজনেস ওয়েবসাইট", "ই-কমার্স স্টোর", "অ্যাডমিন ড্যাশবোর্ড", "কাস্টম পোর্টাল ও SaaS"] },
  { icon: "Smartphone", title: "মোবাইল অ্যাপ", items: ["Android অ্যাপ (Java/Kotlin)", "iOS অ্যাপ (Swift)", "ক্রস-প্ল্যাটফর্ম অ্যাপ", "অ্যাপ মেইনটেন্যান্স"] },
  { icon: "Settings", title: "কাস্টম সফটওয়্যার", items: ["বিজনেস অটোমেশন", "CRM ও ইনভেন্টরি", "ERP সলিউশন", "API ইন্টিগ্রেশন"] },
  { icon: "Palette", title: "ডিজাইন ও UX", items: ["UI/UX ডিজাইন", "মোবাইল-ফ্রেন্ডলি লেআউট", "ব্র্যান্ডিং", "প্রোটোটাইপিং"] },
];

const PROCESS = ["কনসালটেশন", "ডিজাইন", "ডেভেলপমেন্ট", "টেস্টিং", "ডেলিভারি", "সাপোর্ট"];

export default function ServicesPage() {
  return (
    <>
      <PageHero title="সফটওয়্যার সমাধান — XafLab" sub="ওয়েব অ্যাপ, মোবাইল অ্যাপ ও কাস্টম সফটওয়্যার — Apple Network তৈরি করা টিমের কাছ থেকে।" />
      <div className="container-x mt-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <div key={s.title} className="card p-6">
              <span className="grid h-12 w-12 place-items-center rounded-xl2 bg-brand-light text-brand">
                <Icon name={s.icon} size={24} />
              </span>
              <h2 className="mt-3 text-lg font-bold text-ink">{s.title}</h2>
              <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                {s.items.map((i) => <li key={i}>• {i}</li>)}
              </ul>
            </div>
          ))}
        </div>

        {/* Process */}
        <h2 className="section-title mb-4 mt-12">আমাদের প্রসেস</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          {PROCESS.map((step, i) => (
            <div key={step} className="rounded-xl2 border border-gray-100 p-4 text-center">
              <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-brand text-sm font-bold text-white">{(i + 1).toLocaleString("bn-BD")}</div>
              <p className="mt-2 text-sm font-medium text-ink-soft">{step}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-xl2 bg-ink p-8 text-white sm:flex-row">
          <div>
            <h3 className="text-xl font-bold">আপনার প্রজেক্ট শুরু করুন</h3>
            <p className="mt-1 text-sm text-white/70">কোয়াট পেতে আজই যোগাযোগ করুন।</p>
          </div>
          <div className="flex gap-3">
            <Link href="/contact" className="btn-primary">কোয়াট পান</Link>
            <Link href="/services/social-media" className="rounded-lg border border-white/30 px-5 py-3 font-semibold text-white transition hover:bg-white/10">সোশ্যাল মিডিয়া</Link>
          </div>
        </div>
      </div>
    </>
  );
}
