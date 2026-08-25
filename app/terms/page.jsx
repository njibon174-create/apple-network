// app/terms/page.jsx — PAGE 18: Terms of Service
import { PageHero } from "@/components/ui";

export const metadata = {
  title: "Terms of Service — Apple Network Bangladesh",
  description: "Apple Network's Terms of Service — ordering, payment, delivery, returns, warranty, website use and limitations. Please read before you buy.",
  robots: { index: false, follow: true },
};

const SECTIONS = [
  ["১. সাধারণ", "এই ওয়েবসাইটের ব্যবহার মানে আপনি এই টার্মস মেনে চলবেন। শর্তাবলী সময়ের সাথে পরিবর্তন হতে পারে।"],
  ["২. অর্ডার ও কনফার্মেশন", "অর্ডার দেওয়ার অর্থ আপনি টার্মস স্বীকার করছেন। স্টক শেষ হলে আমরা জানাব ও বিকল্প দেব।"],
  ["৩. পেমেন্ট", "ক্যাশ অন ডেলিভারি, ব্যাংক ট্রানজেকশন, মোবাইল ব্যাংকিং, কার্ড, EMI। প্রতারণামূলক অর্ডার বাতিল করা হতে পারে।"],
  ["৪. ডেলিভারি", "ফ্রি ডেলিভারি পুরো বাংলাদেশে। ডেলিভারির সময় আনুমানিক; ট্রাফিক/মৌসুমের ওপর নির্ভর করে।"],
  ["৫. রিটার্ন ও এক্সচেঞ্জ", "শর্তাধীন — প্রোডাক্ট দেখানো অবস্থার থেকে আলাদা হলে বা ফ্যাক্টরি ডিফেক্ট থাকলে আলোচনা করি।"],
  ["৬. ওয়ারেন্টি", "অফিশিয়াল: ম্যানুফ্যাকচারার ওয়ারেন্টি। প্রিলাভড: সেলার ওয়ারেন্টি (কন্ডিশন অনুযায়ী)। দুর্ঘটনা/মিসইউজ কভার করে না।"],
  ["৭. ওয়েবসাইট ব্যবহার", "ব্যক্তিগত ব্যবহারের জন্য। কনটেন্ট/লোগো অনুমতি ছাড়া কপি নিষিদ্ধ। স্ক্র্যাপিং/স্প্যাম নিষিদ্ধ।"],
  ["৮. ডিসক্লেইমার", "প্রোডাক্ট স্পেসিফিকেশন, ছবি বা দাম পরিবর্তন হতে পারে। অর্ডারের আগে বিস্তারিত চেক করুন।"],
  ["৯. দায়িত্ব সীমাবদ্ধতা", "আমাদের দায়িত্ব প্রোডাক্টের দামের মধ্যে সীমিত (আইনি সীমা অনুযায়ী)।"],
  ["১০. প্রযোজ্য আইন", "এই শর্তাবলী বাংলাদেশের আইনের অধীন।"],
];

export default function TermsPage() {
  return (
    <>
      <PageHero title="টার্মস অফ সার্ভিস" sub="Apple Network ওয়েবসাইট ও স্টোর ব্যবহারের নীতিমালা।" />
      <div className="container-x mt-8 max-w-3xl">
        {SECTIONS.map(([title, body]) => (
          <div key={title} className="mb-5">
            <h2 className="mb-1.5 text-lg font-bold text-ink">{title}</h2>
            <p className="text-sm text-ink-soft">{body}</p>
          </div>
        ))}
        <p className="text-xs text-ink-muted">সর্বশেষ আপডেট: ২০২৬। প্রশ্ন থাকলে যোগাযোগ পেজে যান।</p>
      </div>
    </>
  );
}
