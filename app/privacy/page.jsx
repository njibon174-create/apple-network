// app/privacy/page.jsx — PAGE 17: Privacy Policy
import { PageHero } from "@/components/ui";

export const metadata = {
  title: "Privacy Policy — Apple Network Bangladesh",
  description: "Apple Network's Privacy Policy: how we collect, use, store and protect your personal information — and the rights you have over your data.",
  robots: { index: false, follow: true },
};

const SECTIONS = [
  ["১. আমরা কী কী তথ্য সংগ্রহ করি", ["যোগাযোগ তথ্য: নাম, ফোন, ইমেইল — অর্ডার আপডেট ও যোগাযোগের জন্য।", "শিপিং তথ্য: ঠিকানা, জেলা — শুধু ডেলিভারির জন্য।", "পেমেন্ট তথ্য: পেমেন্ট প্রসেসরের মাধ্যমে নিরাপদে; কার্ডের পূর্ণ তথ্য সংরক্ষণ করি না।", "ব্রাউজিং তথ্য: কুকির মাধ্যমে অ্যানালিটিক্স (আপনার সম্মতিতে)।"]],
  ["২. তথ্য কীভাবে ব্যবহার করি", ["অর্ডার প্রসেস ও ডেলিভারি।", "কাস্টমার সাপোর্ট।", "ডেলিভারি ও ট্র্যাকিং আপডেট।", "অফার/প্রমোশন (সম্মতিতে; যেকোনো সময় অপ্ট-আউট)।"]],
  ["৩. তথ্য কার সাথে শেয়ার করা হয়", ["ডেলিভারি পার্টনার — ন্যূনতম তথ্য (ঠিকানা, ফোন)।", "পেমেন্ট প্রসেসর — পেমেন্টের জন্য।", "আমরা আপনার তথ্য বিক্রি করি না।"]],
  ["৪. তথ্য সুরক্ষা", ["সিকিউর পেমেন্ট গেটওয়ে।", "অ্যাক্সেস কন্ট্রোল।", "নিয়মিত নিরাপত্তা রিভিউ।"]],
  ["৫. কুকি", ["সেশন, অ্যানালিটিক্স ও পার্সিস্টেন্ট কুকি (সম্মতিতে)। ব্রাউজার সেটিংস থেকে ম্যানেজ করা যায়।"]],
  ["৬. আপনার অধিকার", ["তথ্য দেখা/সম্পাদনা।", "মার্কেটিং থেকে অপ্ট-আউট।", "তথ্য মুছে ফেলার অনুরোধ (আইনি রেকর্ড ব্যতীত)।"]],
  ["৭. পলিসি আপডেট", ["পরিবর্তন হলে ওয়েবসাইটে নতুন ভার্সন দেওয়া হবে।"]],
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero title="প্রাইভেসি পলিসি" sub="আপনার তথ্য কীভাবে সংগ্রহ, ব্যবহার ও সুরক্ষিত রাখি।" />
      <div className="container-x mt-8 max-w-3xl">
        {SECTIONS.map(([title, items]) => (
          <div key={title} className="mb-6">
            <h2 className="mb-2 text-lg font-bold text-ink">{title}</h2>
            <ul className="ml-5 list-disc space-y-1.5 text-sm text-ink-soft">
              {items.map((it) => <li key={it}>{it}</li>)}
            </ul>
          </div>
        ))}
        <p className="text-xs text-ink-muted">সর্বশেষ আপডেট: ২০২৬। প্রশ্ন থাকলে যোগাযোগ পেজে যান।</p>
      </div>
    </>
  );
}
