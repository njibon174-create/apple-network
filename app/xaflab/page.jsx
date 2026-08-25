// app/xaflab/page.jsx — PAGE 7: About XafLab (builder/agency)
import Link from "next/link";
import { PageHero } from "@/components/ui";

export const metadata = {
  title: "About XafLab — Software & Social Media Solutions",
  description: "XafLab builds web apps, mobile apps and custom software, and runs social media services — boosting, post & page management — for businesses in Bangladesh.",
};

export default function XafLabPage() {
  return (
    <>
      <PageHero title="XafLab-এর পরিচয়" sub="Apple Network তৈরি করা টিম — আপনার টেক পার্টনার।" />
      <div className="container-x mt-8 grid gap-8 lg:grid-cols-3">
        <article className="prose-bn lg:col-span-2">
          <h2>XafLab — আপনার টেক সলিউশন পার্টনার</h2>
          <p>XafLab হলো একটি বাংলাদেশ-ভিত্তিক টেক সলিউশনস প্রোভাইডার — যারা ওয়েব অ্যাপ্লিকেশন, মোবাইল অ্যাপ, কাস্টম সফটওয়্যার ডেভেলপমেন্ট এবং সোশ্যাল মিডিয়া সার্ভিস দিয়ে গ্রাহকদের সাপোর্ট করে। Apple Network-এর ওয়েবসাইট ও অনলাইন স্টোর XafLab কর্তৃক নির্মিত।</p>
          <p>আমরা মনে করি প্রযুক্তি মানে শুধু সফটওয়্যার নয় — এটি গ্রাহকের জীবন সহজ করা, ব্যবসার রিচ বাড়ানো এবং বিশ্বাসযোগ্য প্ল্যাটফর্ম তৈরি করা।</p>
          <h2>আমরা কী কী সার্ভিস দিই</h2>
          <ul>
            <li><strong>ওয়েব অ্যাপ্লিকেশন:</strong> কাস্টম ওয়েবসাইট, ই-কমার্স স্টোর, পোর্টাল, ড্যাশবোর্ড।</li>
            <li><strong>মোবাইল অ্যাপ:</strong> অ্যান্ড্রয়েড ও আইওএস অ্যাপ — স্টার্টআপ ও বিজনেসের জন্য।</li>
            <li><strong>কাস্টম সফটওয়্যার:</strong> অটোমেশন, CRM, ইনভেন্টরি ও আরও।</li>
            <li><strong>সোশ্যাল মিডিয়া সার্ভিস:</strong> পোস্ট ম্যানেজমেন্ট, পেজ ম্যানেজমেন্ট, কন্টেন্ট প্ল্যানিং, বুস্টিং।</li>
          </ul>
          <h2>কেন XafLab</h2>
          <p>আমরা শুধু কোড লিখি না — আমরা গ্রাহকদের সাথে কথা বলি, তাদের প্রয়োজন বুঝি, তারপর সমাধান তৈরি করি। প্রতিটি প্রজেক্টে মিটিং, রিকোয়ারমেন্ট, স্কোপিং এবং পর্যায়ক্রমে ডেলিভারি।</p>
        </article>
        <aside className="space-y-4">
          <div className="rounded-xl2 bg-gradient-to-br from-brand to-accent-yellow p-6 text-white">
            <p className="font-semibold">একটি প্রজেক্ট শুরু করুন</p>
            <p className="mt-1 text-sm text-white/80">ওয়েব, অ্যাপ বা সোশ্যাল মিডিয়া — আমরা সাহায্য করি।</p>
          </div>
          <Link href="/services" className="btn-primary w-full">সফটওয়্যার সার্ভিস →</Link>
          <Link href="/services/social-media" className="btn-secondary w-full">সোশ্যাল মিডিয়া সার্ভিস</Link>
          <Link href="/contact" className="btn-ghost w-full">যোগাযোগ করুন</Link>
        </aside>
      </div>
    </>
  );
}
