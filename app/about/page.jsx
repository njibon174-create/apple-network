// app/about/page.jsx — PAGE 6: About Apple Network (store)
import Link from "next/link";
import { PageHero } from "@/components/ui";
import Icon from "@/components/Icon";

export const metadata = {
  title: "About Apple Network — Trusted Phone Store in Bangladesh",
  description: "Apple Network — Bangladesh's trusted store for new & used phones, official & unofficial, plus accessories & electronics. EMI, exchange & free delivery.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero title="Apple Network-এর পরিচয়" sub="বাংলাদেশের বিশ্বস্ত ফোন ও ইলেকট্রনিক্স স্টোর — সৎ দামে আসল পণ্য।" />
      <div className="container-x mt-8 grid gap-8 lg:grid-cols-3">
        <article className="prose-bn lg:col-span-2">
          <h2>আমরা কারা</h2>
          <p>Apple Network হলো বাংলাদেশ-ভিত্তিক একটি ই-কমার্স স্টোর, যেখানে আপনি পাবেন নতুন এবং প্রিলাভড মোবাইল ফোন — অফিশিয়াল ও আনঅফিশিয়াল — পাশাপাশি অ্যাক্সেসরিজ, ল্যাপটপ, ট্যাবলেট, স্মার্টওয়াচ ও স্মার্ট টিভি। আমাদের লক্ষ্য একটাই — সৎ দামে আসল পণ্য, আর প্রতিটি গ্রাহকের জন্য নিশ্চিন্ত কেনাকাটার অভিজ্ঞতা।</p>
          <p>আমরা শুরু করেছিলাম একটি সহজ বিশ্বাস থেকে — একটি ফোন কেনা মানে শুধু টাকা দেওয়া নয়, বরং একটা ভরসা করা। তাই প্রতিটি পণ্য যাচাই করে, স্বচ্ছভাবে লেবেল করে গ্রাহকের কাছে পৌঁছে দিই।</p>
          <h2>আমাদের লক্ষ্য ও দৃষ্টিভঙ্গি</h2>
          <p><strong>লক্ষ্য:</strong> সৎ দাম, আসল পণ্য এবং স্বচ্ছ তথ্য দিয়ে প্রতিটি মানুষের হাতে নির্ভরযোগ্য প্রযুক্তি পৌঁছে দেওয়া।</p>
          <p><strong>দৃষ্টিভঙ্গি:</strong> বাংলাদেশের সবচেয়ে বিশ্বস্ত ফোন ও ইলেকট্রনিক্স গন্তব্য হয়ে ওঠা — যেখানে গ্রাহক জানেন, তিনি ঠিক কী কিনছেন এবং কেন।</p>
          <h2>কেন Apple Network</h2>
          <ul>
            <li><strong>১০০% অথেন্টিক পণ্য</strong> — ফেক প্রোডাক্ট নেই। প্রিলাভড পণ্য যাচাই করা।</li>
            <li><strong>স্বচ্ছ প্রিলাভড গ্রেডিং</strong> — প্রতিটি পুরানো ফোনের কন্ডিশন স্পষ্ট করে বলা থাকে।</li>
            <li><strong>EMI ও এক্সচেঞ্জ</strong> — ২৪+ ব্যাংকে ৩৬ মাস EMI, পুরানো ফোন এক্সচেঞ্জের সুযোগ।</li>
            <li><strong>ফ্রি নেশনওয়াইড ডেলিভারি</strong> — ঢাকা থেকে দূরের জেলা পর্যন্ত।</li>
            <li><strong>রিয়েল সাপোর্ট</strong> — চ্যাট, কল বা সরাসরি স্টোরে।</li>
          </ul>
        </article>
        <aside className="space-y-4">
          <div className="rounded-xl2 bg-ink p-6 text-white">
            <p className="text-3xl font-bold text-brand">৫+</p>
            <p className="text-sm text-white/70">বছরের অভিজ্ঞতা</p>
            <div className="mt-4 space-y-2 text-sm">
              <p className="flex items-center gap-2"><Icon name="CheckCircle2" size={15} className="text-brand" /> হাজারো সন্তুষ্ট গ্রাহক</p>
              <p className="flex items-center gap-2"><Icon name="Smartphone" size={15} className="text-brand" /> ১,৭০০+ প্রোডাক্ট</p>
              <p className="flex items-center gap-2"><Icon name="Building2" size={15} className="text-brand" /> ঢাকা ও চট্টগ্রামে উপস্থিতি</p>
            </div>
          </div>
          <Link href="/shop" className="btn-primary w-full">প্রোডাক্ট দেখুন →</Link>
          <Link href="/contact" className="btn-secondary w-full">যোগাযোগ করুন</Link>
        </aside>
      </div>
    </>
  );
}
