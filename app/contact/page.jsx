// app/contact/page.jsx — PAGE 10: Contact
import { PageHero } from "@/components/ui";
import Icon from "@/components/Icon";
import { SITE } from "@/lib/data";

export const metadata = {
  title: "Contact Apple Network — Chat, Call & Store Locations",
  description: "Contact Apple Network — chat online, call us, or visit a store in Bangladesh. Ask about phones, EMI, exchange offers, delivery and more.",
};

// LocalBusiness schema for local SEO
const schema = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "Apple Network",
  telephone: SITE.phone,
  email: SITE.email,
  address: { "@type": "PostalAddress", streetAddress: SITE.address, addressCountry: "BD" },
  openingHours: "Mo-Su 10:00-20:00",
};

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <PageHero title="যোগাযোগ করুন" sub="একটি নতুন ফোন, এক্সচেঞ্জ অফার বা ডেলিভারি — যেকোনো প্রশ্নে আমরা আছি।" />
      <div className="container-x mt-8 grid gap-8 lg:grid-cols-2">
        {/* Contact info */}
        <div className="space-y-4">
          {[
            ["MessageCircle", "লাইভ চ্যাট", "ওয়েবসাইটের চ্যাট আইকনে ক্লিক করুন — বাংলা ও ইংরেজি সাপোর্ট। সকাল ১০টা – রাত ৮টা।"],
            ["Phone", "ফোন / মেসেজ", `${SITE.phone} — ব্যবসায়িক সময়ে কল বা মেসেজ দিন।`],
            ["Mail", "ইমেইল", `${SITE.email} / ${SITE.supportEmail} — সাধারণত ২৪ ঘণ্টার মধ্যে রিপ্লাই।`],
            ["MapPin", "স্টোর লোকেশন", SITE.address + " — সরাসরি ফোন দেখে কিনতে পারেন।"],
          ].map(([icon, title, desc]) => (
            <div key={title} className="flex gap-4 rounded-xl2 border border-gray-100 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-light text-brand"><Icon name={icon} size={20} /></span>
              <div>
                <h3 className="font-semibold text-ink">{title}</h3>
                <p className="mt-0.5 text-sm text-ink-soft">{desc}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-xl2 bg-brand-light p-4">
            <Icon name="Clock" size={16} className="text-brand-700" />
            <p className="text-sm font-semibold text-brand-700">{SITE.hours}</p>
          </div>
        </div>

        {/* Contact form (UI mockup) */}
        <div className="rounded-xl2 border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-ink">মেসেজ পাঠান</h2>
          <form className="mt-4 space-y-3" onSubmit={undefined}>
            <Field label="আপনার নাম" placeholder="নাম লিখুন" />
            <Field label="ইমেইল বা ফোন" placeholder="যোগাযোগের তথ্য" />
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-soft">আগ্রহের বিষয়</label>
              <select className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand">
                <option>ফোন কেনা</option><option>এক্সচেঞ্জ অফার</option><option>EMI</option><option>সার্ভিস (XafLab)</option><option>অন্যান্য</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-soft">মেসেজ</label>
              <textarea rows={4} placeholder="আপনার বার্তা লিখুন…" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand" />
            </div>
            <button type="button" className="btn-primary w-full">মেসেজ পাঠান</button>
          </form>
        </div>
      </div>
    </>
  );
}

function Field({ label, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink-soft">{label}</label>
      <input placeholder={placeholder} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand" />
    </div>
  );
}
