// components/ui.jsx
// Why: small shared presentational components used across many pages.
import Link from "next/link";
import { CATEGORIES } from "@/lib/data";
import Icon from "@/components/Icon";

export function TrustBadges() {
  const items = [
    { icon: "BadgeCheck", label: "১০০% অথেন্টিক" },
    { icon: "Truck", label: "ফ্রি ডেলিভারি" },
    { icon: "CreditCard", label: "৩৬ মাস EMI" },
    { icon: "RefreshCw", label: "এক্সচেঞ্জ অফার" },
    { icon: "ShieldCheck", label: "ওয়ারেন্টি" },
  ];
  return (
    <section className="container-x mt-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white p-3 shadow-card">
            <Icon name={it.icon} size={20} className="shrink-0 text-brand" />
            <span className="text-xs font-medium text-ink-soft sm:text-sm">{it.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CategoryGrid() {
  return (
    <section className="container-x mt-12">
      <h2 className="section-title mb-4">ক্যাটাগরি অনুযায়ী কিনুন</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {CATEGORIES.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className="card flex flex-col items-center gap-2 p-4 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-light text-brand">
              <Icon name={c.icon} size={24} />
            </span>
            <span className="text-xs font-semibold text-ink sm:text-sm">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function Breadcrumb({ items }) {
  return (
    <nav className="container-x pt-4 text-xs text-ink-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {it.href ? <Link href={it.href} className="hover:text-brand">{it.label}</Link> : <span className="text-ink-soft">{it.label}</span>}
            {i < items.length - 1 && <Icon name="ChevronRight" size={12} />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SectionHeader({ title, href, linkLabel = "সব দেখুন" }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="section-title">{title}</h2>
      {href && <Link href={href} className="text-sm font-medium text-brand hover:underline">{linkLabel} →</Link>}
    </div>
  );
}

export function PageHero({ title, sub }) {
  return (
    <div className="border-b border-gray-100 bg-gradient-to-br from-brand-light to-white">
      <div className="container-x py-8 sm:py-10">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-sm text-ink-soft sm:text-base">{sub}</p>}
      </div>
    </div>
  );
}
