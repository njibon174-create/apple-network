// app/blog/page.jsx — PAGE 19: Blog / News hub
import Link from "next/link";
import { PageHero } from "@/components/ui";
import Icon from "@/components/Icon";
import { BLOG_POSTS } from "@/lib/data";

export const metadata = {
  title: "Apple Network Blog — Phone Buying Tips & Guides (Bangladesh)",
  description: "The Apple Network blog — practical guides on buying new & used phones, EMI, exchange offers and phone care in Bangladesh, plus honest buying advice.",
};

export default function BlogPage() {
  return (
    <>
      <PageHero title="Apple Network ব্লগ" sub="ফোন কেনার গাইড, টিপস ও রিভিউ — নতুন ও পুরানো ফোন, EMI, এক্সচেঞ্জ এবং ব্যাটারি কেয়ার।" />
      <div className="container-x mt-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BLOG_POSTS.map((post, i) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="card group flex flex-col overflow-hidden">
              <div className="flex aspect-video items-center justify-center bg-brand-light text-brand">
                <Icon name="FileText" size={40} />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <span className="badge w-fit">{post.cat}</span>
                <h2 className="mt-2 font-bold text-ink group-hover:text-brand">{post.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{post.excerpt}</p>
                <p className="mt-auto flex items-center gap-1 pt-3 text-xs text-ink-muted"><Icon name="BookOpen" size={13} /> {post.read} পড়া</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
