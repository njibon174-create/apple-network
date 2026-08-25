// app/shop/page.jsx — PAGE 2: Shop / Catalog
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { PageHero } from "@/components/ui";
import Icon from "@/components/Icon";
import { PRODUCTS, CATEGORIES } from "@/lib/data";
import { getProducts } from "@/lib/store";

export const metadata = {
  title: "Shop All Phones & Electronics — Apple Network Bangladesh",
  description: "Browse Apple Network's full catalog: new & used phones, accessories, laptops, tablets, smartwatches, smart TVs & gadgets. Filter by price, brand & condition.",
};

export default async function ShopPage() {
  const products = await getProducts();
  const count = products.length;
  return (
    <>
      <PageHero title="সব প্রোডাক্ট" sub="নতুন স্মার্টফোন থেকে প্রিলাভড ফোন, ফ্ল্যাগশিপ থেকে বাজেট — সব এক জায়গায়। ক্যাটাগরি, দাম বা কন্ডিশন দিয়ে ফিল্টার করুন।" />
      <div className="container-x mt-6 flex flex-col gap-6 lg:flex-row">
        {/* Sidebar categories */}
        <aside className="lg:w-56 lg:shrink-0">
          <h2 className="mb-3 text-sm font-bold text-ink">ক্যাটাগরি</h2>
          <div className="flex flex-wrap gap-2 lg:flex-col">
            <Link href="/shop" className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white">সব প্রোডাক্ট</Link>
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-gray-100">
                {c.icon} {c.name}
              </Link>
            ))}
          </div>
          <div className="mt-6 hidden rounded-lg border border-gray-100 bg-brand-light p-4 lg:block">
            <p className="flex items-center gap-2 text-sm font-semibold text-brand-700"><Icon name="CreditCard" size={16} /> EMI সুবিধা</p>
            <p className="mt-1 text-xs text-ink-soft">২৪+ ব্যাংকে ৩৬ মাস পর্যন্ত কিস্তিতে কিনুন।</p>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-ink-muted">{count.toLocaleString("bn-BD")}টি প্রোডাক্ট</p>
            <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-ink-soft outline-none">
              <option>জনপ্রিয়তা অনুযায়ী</option>
              <option>দাম: কম → বেশি</option>
              <option>দাম: বেশি → কম</option>
              <option>নতুন আগত</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {products.map((p) => <ProductCard key={p.slug} p={p} />)}
          </div>
        </div>
      </div>
    </>
  );
}
