// app/product/[slug]/page.jsx — PAGE 5: Product Detail (dynamic template)
import { notFound } from "next/navigation";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import ProductDetail from "@/components/ProductDetail";
import { Breadcrumb } from "@/components/ui";
import Icon from "@/components/Icon";
import { CATEGORIES, PRODUCTS } from "@/lib/data";
import { getProduct, getByCategory, getProducts } from "@/lib/store";

export async function generateStaticParams() {
  try {
    const live = await getProducts({ limit: 100 });
    if (live.length) return live.map((p) => ({ slug: p.slug }));
  } catch {}
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }) {
  const p = getProduct(params.slug);
  if (!p) return {};
  return {
    title: `${p.name} — Price in Bangladesh | Apple Network`,
    description: `Buy ${p.name} (${p.storage || ""}) at Apple Network — ${p.official ? "official" : "unofficial"}, EMI, exchange offer, warranty & free delivery in Bangladesh.`,
    openGraph: { type: "website", title: `${p.name} — Apple Network`, description: p.desc, images: [p.image] },
  };
}

export default async function ProductPage({ params }) {
  const p = await getProduct(params.slug);
  if (!p) return notFound();
  const cat = CATEGORIES.find((c) => c.slug === p.category);
  const related = (await getByCategory(p.category)).filter((x) => x.slug !== p.slug).slice(0, 4);

  // Product schema (JSON-LD) — SEO rich result
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    brand: { "@type": "Brand", name: p.brand },
    description: p.desc,
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: p.price,
      availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
    },
    aggregateRating: p.rating ? { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews } : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: cat?.name || "শপ", href: `/category/${p.category}` }, { label: p.name }]} />

      <div className="container-x mt-4">
        {/* Interactive top section (client component) */}
        <ProductDetail p={p} />
      </div>

      {/* Description + specs */}
      <div className="container-x mt-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="section-title mb-3">প্রোডাক্ট বিবরণ</h2>
          <p className="prose-bn">{p.desc}</p>

          {p.specs && (
            <>
              <h2 className="section-title mb-3 mt-8">স্পেসিফিকেশন</h2>
              <div className="overflow-hidden rounded-xl2 border border-gray-100">
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(p.specs).map(([k, v], i) => (
                      <tr key={k} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                        <td className="w-1/3 px-4 py-2.5 font-medium text-ink-soft">{k}</td>
                        <td className="px-4 py-2.5 text-ink">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Reviews */}
          <h2 className="section-title mb-3 mt-8">কাস্টমার রিভিউ</h2>
          <div className="space-y-3">
            {[
              ["রাকিব, ঢাকা", "দাম অনুযায়ী দারুণ ফোন। ডেলিভারি দ্রুত ছিল, বক্স সিলড পেয়েছি।", 5],
              ["সুমাইয়া, চট্টগ্রাম", "কন্ডিশন ঠিক যেমন বলা ছিল। ব্যাটারিও ভালো।", 4],
            ].map(([who, txt, stars]) => (
              <div key={who} className="rounded-lg border border-gray-100 p-4">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Icon key={n} name="Star" size={14} className={n <= stars ? "fill-accent-yellow text-accent-yellow" : "text-gray-200"} />
                  ))}
                </div>
                <p className="mt-1 text-sm text-ink-soft">{txt}</p>
                <p className="mt-1 text-xs text-ink-muted">— {who}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: warranty + box */}
        <aside className="space-y-4">
          <div className="rounded-xl2 border border-gray-100 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-ink"><Icon name="ShieldCheck" size={18} className="text-brand" /> ওয়ারেন্টি</h3>
            <p className="mt-2 text-sm text-ink-soft">{p.official ? "অফিশিয়াল প্রোডাক্টে সাধারণত ১২ মাস ম্যানুফ্যাকচারার ওয়ারেন্টি।" : "সেলার ওয়ারেন্টি — কন্ডিশন অনুযায়ী ৭–৩০ দিন চেকিং/রিপ্লেসমেন্ট।"}</p>
          </div>
          <div className="rounded-xl2 border border-gray-100 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-ink"><Icon name="Package" size={18} className="text-brand" /> বক্সে যা থাকছে</h3>
            <ul className="mt-2 space-y-1 text-sm text-ink-soft">
              <li>• হ্যান্ডসেট</li><li>• চার্জিং ক্যাবল (USB-C)</li><li>• সিম ইজেক্টর টুল</li><li>• ম্যানুয়াল ও ওয়ারেন্টি কার্ড</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="container-x mt-12">
          <h2 className="section-title mb-4">সম্পর্কিত প্রোডাক্ট</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map((r) => <ProductCard key={r.slug} p={r} />)}
          </div>
        </section>
      )}
    </>
  );
}
