// app/faq/page.jsx — PAGE 11: FAQ (with FAQPage schema for rich snippets)
import Link from "next/link";
import { PageHero } from "@/components/ui";

export const metadata = {
  title: "FAQ — Apple Network Bangladesh: Phones, EMI, Delivery & More",
  description: "Questions about phones, EMI, exchange, delivery or returns at Apple Network? Find clear answers on new & used, official & unofficial phones and more.",
};

const FAQS = [
  { q: "Apple Network কী?", a: "Apple Network হলো বাংলাদেশের একটি ই-কমার্স স্টোর যেখানে নতুন ও প্রিলাভড মোবাইল ফোন — অফিশিয়াল ও আনঅফিশিয়াল — অ্যাক্সেসরিজ, ল্যাপটপ, ট্যাবলেট, স্মার্টওয়াচ ও আরও ইলেকট্রনিক্স কিনতে পারেন।" },
  { q: "Apple Network কি অফিশিয়াল ও প্রিলাভড — দুই ধরনের ফোনই বিক্রি করে?", a: "হ্যাঁ। আমরা নতুন অফিশিয়াল ফোন (বক্সড, ওয়ারেন্টিসহ) এবং যাচাই করা প্রিলাভড/রিফার্বিশড ফোন — দুটোই বিক্রি করি। প্রতিটি ডিভাইসের কন্ডিশন স্পষ্ট করে লেবেল করা থাকে।" },
  { q: "অফিশিয়াল ও আনঅফিশিয়াল ফোনের পার্থক্য কী?", a: "অফিশিয়াল: আসল আমদানি, সিল/বক্সড, ম্যানুফ্যাকচারার ওয়ারেন্টি প্রযোজ্য। আনঅফিশিয়াল: যাচাই করা, স্বচ্ছভাবে গ্রেড করা ডিভাইস, কম দামে।" },
  { q: "প্রিলাভড (ব্যবহৃত) ফোন কি নিরাপদ?", a: "হ্যাঁ — প্রতিটি প্রিলাভড ফোন আমরা পরীক্ষা করি: স্ক্রিন কন্ডিশন, ব্যাটারি হেলথ, কল/ক্যামেরা/চার্জিং ফাংশন — তারপর Excellent/Good/Fair গ্রেড দিই।" },
  { q: "EMI সুযোগ আছে?", a: "হ্যাঁ, ২৪টিরও বেশি ব্যাংকের মাধ্যমে ৩৬ মাস পর্যন্ত EMI — অনেক ক্ষেত্রে ইন্সটলমেন্ট ফ্রি।" },
  { q: "এক্সচেঞ্জ অফার কীভাবে কাজ করে?", a: "আপনার বর্তমান ফোনটি দিন, নতুন ফোনের দাম থেকে রিয়েল ডিসকাউন্ট পান। এক্সচেঞ্জ ভ্যালু কন্ডিশন, মডেল ও মার্কেট ভ্যালুর ওপর নির্ভর করে — আমরা আগে স্বচ্ছভাবে বলি।" },
  { q: "ডেলিভারি কখন পাবো?", a: "অর্ডারের পর ট্র্যাকিং লিংক দেওয়া হয়। ঢাকা/চট্টগ্রামে দ্রুত, অন্য জেলায় কিছুটা সময় লাগতে পারে।" },
  { q: "কি সব জায়গায় ফ্রি ডেলিভারি?", a: "হ্যাঁ — পুরো বাংলাদেশে ফ্রি ডেলিভারি (কিছু দুর্গম এলাকা ছাড়া, তখন আগে জানানো হয়)।" },
  { q: "কী কী পেমেন্ট অপশন আছে?", a: "ক্যাশ অন ডেলিভারি (সীমিত এলাকায়), ব্যাংক ট্রানজেকশন, মোবাইল ব্যাংকিং (bKash, Nagad, Rocket), ডেবিট/ক্রেডিট কার্ড এবং EMI।" },
  { q: "ওয়ারেন্টি কত দিন?", a: "অফিশিয়াল প্রোডাক্টে সাধারণত ১২ মাস ম্যানুফ্যাকচারার ওয়ারেন্টি। প্রিলাভডে সেলার ওয়ারেন্টি প্রযোজ্য হতে পারে — প্রোডাক্ট পেজে উল্লেখ থাকে।" },
  { q: "রিটার্ন/এক্সচেঞ্জ সুযোগ আছে?", a: "হ্যাঁ — শর্তাধীন রিটার্ন/এক্সচেঞ্জ নীতি আছে। প্রোডাক্ট দেখানো অবস্থার থেকে আলাদা হলে আমরা আলোচনা করি।" },
];

const schema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FAQPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <PageHero title="প্রায়শই জিজ্ঞাসিত প্রশ্ন" sub="Apple Network নিয়ে সবচেয়ে জনপ্রিয় প্রশ্নের উত্তর।" />
      <div className="container-x mt-8 max-w-3xl">
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details key={i} className="group rounded-xl2 border border-gray-100 p-4 [&_summary]:cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-ink marker:content-none">
                {f.q}
                <span className="ml-4 shrink-0 text-brand transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl2 bg-brand-light p-6 text-center">
          <p className="font-semibold text-ink">এখনও প্রশ্ন আছে?</p>
          <Link href="/contact" className="btn-primary">আমাদের সাথে যোগাযোগ করুন</Link>
        </div>
      </div>
    </>
  );
}
