// app/shop/page.jsx — PAGE 2: Shop / Catalog (with working filters)
import Link from "next/link";
import ProductFilter from "@/components/ProductFilter";
import { PageHero } from "@/components/ui";
import Icon from "@/components/Icon";
import { getProducts } from "@/lib/store";

export const metadata = {
  title: "Shop All Phones & Electronics — Apple Network Bangladesh",
  description: "Browse Apple Network's full catalog: new & used phones, accessories, laptops, tablets, smartwatches, smart TVs & gadgets. Filter by price, brand & condition.",
};

export default async function ShopPage() {
  const products = await getProducts();
  return (
    <>
      <PageHero title="সব প্রোডাক্ট" sub="নতুন স্মার্টফোন থেকে প্রিলাভড ফোন, ফ্ল্যাগশিপ থেকে বাজেট — সব এক জায়গায়। ক্যাটাগরি, ব্র্যান্ড, কন্ডিশন বা দাম দিয়ে ফিল্টার করুন।" />
      <ProductFilter products={products} hideCategory={false} />
    </>
  );
}
