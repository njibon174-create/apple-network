// components/Footer.jsx
// Why: sitewide footer with link columns + trust/contact info.
import Link from "next/link";
import { SITE } from "@/lib/data";
import Icon from "@/components/Icon";

export default function Footer() {
  const cols = [
    { title: "শপিং", links: [["/shop","সব প্রোডাক্ট"],["/category/phones","মোবাইল ফোন"],["/category/accessories","অ্যাক্সেসরিজ"],["/track","অর্ডার ট্র্যাক"]] },
    { title: "সার্ভিস (XafLab)", links: [["/services","সফটওয়্যার সমাধান"],["/services/social-media","সোশ্যাল মিডিয়া"],["/xaflab","XafLab সম্পর্কে"]] },
    { title: "সহায়তা", links: [["/faq","FAQ"],["/contact","যোগাযোগ"],["/privacy","প্রাইভেসি পলিসি"],["/terms","টার্মস অফ সার্ভিস"]] },
  ];
  return (
    <footer className="mt-16 border-t border-gray-100 bg-gray-50">
      <div className="container-x grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-lg font-bold text-white">A</span>
            <span className="text-lg font-bold">Apple <span className="text-brand">Network</span></span>
          </div>
          <p className="mt-3 text-sm text-ink-muted">{SITE.tagline}</p>
          <div className="mt-4 space-y-1.5 text-sm text-ink-soft">
            <p className="flex items-center gap-2"><Icon name="Phone" size={14} className="text-brand" /> {SITE.phone}</p>
            <p className="flex items-center gap-2"><Icon name="Mail" size={14} className="text-brand" /> {SITE.email}</p>
            <p className="flex items-center gap-2"><Icon name="Clock" size={14} className="text-brand" /> {SITE.hours}</p>
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="mb-3 text-sm font-bold text-ink">{c.title}</h4>
            <ul className="space-y-2 text-sm text-ink-soft">
              {c.links.map(([href,label]) => (
                <li key={href}><Link href={href} className="transition hover:text-brand">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-4 text-xs text-ink-muted sm:flex-row">
          <p>© ২০২৬ Apple Network — সর্বস্বত্ব সংরক্ষিত।</p>
          <p>নির্মাণে <Link href="/xaflab" className="font-medium text-brand">XafLab</Link></p>
        </div>
      </div>
    </footer>
  );
}
