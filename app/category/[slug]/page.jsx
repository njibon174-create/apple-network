// app/category/[slug]/page.jsx — PAGES 3 & 4 (+ other categories): dynamic category listing
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { PageHero, Breadcrumb } from "@/components/ui";
import { CATEGORIES, BRANDS, CONDITIONS } from "@/lib/data";
import { getByCategory } from "@/lib/store";

// Pre-render all category slugs
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }) {
  const cat = CATEGORIES.find((c) => c.slug === params.slug);
  if (!cat) return {};
  const map = {
    phones: {
      title: "Buy Mobile Phones in Bangladesh — New & Used | Apple Network",
      description: "Widest range of phones in Bangladesh — brand new official phones with warranty, and quality pre-loved (used/refurbished) phones at honest prices. EMI, exchange, free delivery.",
    },
    accessories: {
      title: "Mobile Accessories & Electronics Online Bangladesh — Apple Network",
      description: "Buy mobile accessories, chargers, earbuds, cases, screen protectors, power banks & more at Apple Network — free delivery across Bangladesh.",
    },
  };
  return map[cat.slug] || {
    title: `${cat.en} — Apple Network Bangladesh`,
    description: `Shop ${cat.en} at Apple Network — authentic products, EMI, free delivery across Bangladesh.`,
  };
}

export default async function CategoryPage({ params }) {
  const cat = CATEGORIES.find((c) => c.slug === params.slug);
  if (!cat) return notFound();
  const items = await getByCategory(cat.slug);
  const isPhones = cat.slug === "phones";

  return (
    <>
      <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: "শপ", href: "/shop" }, { label: cat.name }]} />
      <PageHero title={cat.name} sub={cat.desc} />

      <div className="container-x mt-6 flex flex-col gap-6 lg:flex-row">
        {/* Filters */}
        <aside className="lg:w-60 lg:shrink-0">
          <div className="rounded-lg border border-gray-100 p-4">
            <h2 className="mb-3 text-sm font-bold">ফিল্টার</h2>

            {isPhones && (
              <>
                <FilterGroup title="কন্ডিশন" options={CONDITIONS.map((c) => c.label)} />
                <FilterGroup title="ব্র্যান্ড" options={BRANDS} />
              </>
            )}
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold text-ink-soft">দামের পরিসর</p>
              <div className="flex items-center gap-2">
                <input placeholder="৳ কম" className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none" />
                <span className="text-ink-muted">–</span>
                <input placeholder="৳ বেশি" className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="stock" className="accent-brand" />
              <label htmlFor="stock" className="text-sm text-ink-soft">শুধু স্টকে আছে</label>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-ink-muted">{items.length.toLocaleString("bn-BD")}টি প্রোডাক্ট</p>
            <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-ink-soft outline-none">
              <option>জনপ্রিয়তা</option><option>দাম: কম → বেশি</option><option>দাম: বেশি → কম</option>
            </select>
          </div>
          {items.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((p) => <ProductCard key={p.slug} p={p} />)}
            </div>
          ) : (
            <p className="rounded-lg bg-gray-50 p-8 text-center text-sm text-ink-muted">এই ক্যাটাগরিতে শীঘ্রই প্রোডাক্ট আসছে।</p>
          )}

          {/* Educational section for phones */}
          {isPhones && (
            <div className="prose-bn mt-12 rounded-xl2 border border-gray-100 bg-gray-50 p-6">
              <h2>অফিশিয়াল বনাম আনঅফিশিয়াল — পার্থক্য জানুন</h2>
              <ul>
                <li><strong>অফিশিয়াল:</strong> মূল আমদানি, সিল/বক্সড, ম্যানুফ্যাকচারার ওয়ারেন্টি প্রযোজ্য। দাম একটু বেশি, কিন্তু নিরাপদ।</li>
                <li><strong>আনঅফিশিয়াল:</strong> রিফার্বিশড বা ওপেন-বক্স ইউনিট — ভালো কন্ডিশন, স্বচ্ছ গ্রেডিং, কম দামে।</li>
              </ul>
              <h3>নতুন বনাম প্রিলাভড</h3>
              <p>প্রতিটি প্রিলাভড ফোন আমরা যাচাই করি — স্ক্রিন কন্ডিশন, ব্যাটারি হেলথ, কল/ক্যামেরা/চার্জিং ফাংশন — তারপর গ্রেড দিই: <strong>Excellent</strong> (প্রায় নতুন), <strong>Good</strong> (হালকা ব্যবহার), <strong>Fair</strong> (বেশি ব্যবহৃত, কাজ করে)।</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function FilterGroup({ title, options }) {
  return (
    <div className="mb-4 border-b border-gray-100 pb-4">
      <p className="mb-2 text-xs font-semibold text-ink-soft">{title}</p>
      <div className="space-y-1.5">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" className="accent-brand" /> {o}
          </label>
        ))}
      </div>
    </div>
  );
}
