// app/services/social-media/page.jsx — PAGE 9: Services — Social Media (XafLab)
import Link from "next/link";
import { PageHero } from "@/components/ui";
import Icon from "@/components/Icon";

export const metadata = {
  title: "Social Media Services — Boosting & Management | XafLab",
  description: "XafLab's social media services in Bangladesh — post & page management, content planning and boosting to grow your Facebook, Instagram and YouTube presence.",
};

const SERVICES = [
  { icon: "FileEdit", title: "পোস্ট ম্যানেজমেন্ট", items: ["কন্টেন্ট ক্যালেন্ডার", "ইমেজ/ভিডিও/ক্যাপশন তৈরি", "নিয়মিত পোস্টিং", "ট্রেন্ডিং কন্টেন্ট"] },
  { icon: "LayoutGrid", title: "পেজ ম্যানেজমেন্ট", items: ["পেজ সেটআপ ও অপ্টিমাইজেশন", "কমেন্ট ও মেসেজ রিপ্লাই", "কমিউনিটি ম্যানেজমেন্ট", "লিড জেনারেশন"] },
  { icon: "Rocket", title: "সোশ্যাল বুস্টিং", items: ["টার্গেটেড অ্যাড ক্যাম্পেইন", "এনগেজমেন্ট বুস্ট", "ফলোয়ার গ্রোথ", "রিটার্গেটিং অ্যাড"] },
  { icon: "BarChart3", title: "কন্টেন্ট প্ল্যানিং", items: ["ব্র্যান্ড ভয়েস সেটআপ", "ক্যাম্পেইন প্ল্যানিং", "পারফরম্যান্স রিপোর্ট", "কম্পিটিটর অ্যানালাইসিস"] },
];

export default function SocialMediaPage() {
  return (
    <>
      <PageHero title="সোশ্যাল মিডিয়া সার্ভিস — XafLab" sub="ফেসবুক, ইনস্টাগ্রাম ও ইউটিউবে আপনার ব্র্যান্ড বাড়ান — বুস্টিং, পোস্ট ও পেজ ম্যানেজমেন্ট।" />
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

        {/* Platforms */}
        <h2 className="section-title mb-4 mt-12">যেসব প্ল্যাটফর্মে কাজ করি</h2>
        <div className="flex flex-wrap gap-3">
          {["Facebook", "Instagram", "YouTube", "TikTok", "LinkedIn"].map((p) => (
            <span key={p} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-ink-soft">{p}</span>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-xl2 bg-gradient-to-r from-brand to-accent-yellow p-8 text-white sm:flex-row">
          <div>
            <h3 className="text-xl font-bold">সোশ্যাল মিডিয়া প্ল্যান পান</h3>
            <p className="mt-1 text-sm text-white/80">ফ্রি কনসালটেশনের জন্য যোগাযোগ করুন।</p>
          </div>
          <Link href="/contact" className="rounded-lg bg-white px-6 py-3 font-semibold text-ink">শুরু করুন →</Link>
        </div>
      </div>
    </>
  );
}
