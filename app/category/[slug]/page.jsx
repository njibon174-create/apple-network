// app/category/[slug]/page.jsx — PAGES 3 & 4: dynamic category listing (with working filters)
import { notFound } from "next/navigation";
import ProductFilter from "@/components/ProductFilter";
import { PageHero, Breadcrumb } from "@/components/ui";
import { CATEGORIES } from "@/lib/data";
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

      <ProductFilter products={items} isPhones={isPhones} hideCategory />

      {/* Educational section for phones */}
      {isPhones && (
        <div className="container-x mt-12">
          <div className="prose-bn rounded-xl2 border border-gray-100 bg-gray-50 p-6">
            <h2>অফিশিয়াল বনাম আনঅফিশিয়াল — পার্থক্য জানুন</h2>
            <ul>
              <li><strong>অফিশিয়াল:</strong> মূল আমদানি, সিল/বক্সড, ম্যানুফ্যাকচারার ওয়ারেন্টি প্রযোজ্য। দাম একটু বেশি, কিন্তু নিরাপদ।</li>
              <li><strong>আনঅফিশিয়াল:</strong> রিফার্বিশড বা ওপেন-বক্স ইউনিট — ভালো কন্ডিশন, স্বচ্ছ গ্রেডিং, কম দামে।</li>
            </ul>
            <h3>নতুন বনাম প্রিলাভড</h3>
            <p>প্রতিটি প্রিলাভড ফোন আমরা যাচাই করি — স্ক্রিন কন্ডিশন, ব্যাটারি হেলথ, কল/ক্যামেরা/চার্জিং ফাংশন — তারপর গ্রেড দিই: <strong>Excellent</strong> (প্রায় নতুন), <strong>Good</strong> (হালকা ব্যবহার), <strong>Fair</strong> (বেশি ব্যবহৃত, কাজ করে)।</p>
          </div>
        </div>
      )}
    </>
  );
}
