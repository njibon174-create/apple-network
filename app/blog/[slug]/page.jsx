// app/blog/[slug]/page.jsx — individual blog post (makes blog cards clickable)
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui";
import Icon from "@/components/Icon";
import { BLOG_POSTS } from "@/lib/data";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default function BlogPostPage({ params }) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
  if (!post) return notFound();

  // Article schema
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    publisher: { "@type": "Organization", name: "Apple Network" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: "ব্লগ", href: "/blog" }, { label: post.cat }]} />
      <article className="container-x mt-4 max-w-3xl">
        <span className="badge">{post.cat}</span>
        <h1 className="mt-3 text-3xl font-bold text-ink">{post.title}</h1>
        <p className="mt-2 flex items-center gap-1 text-sm text-ink-muted"><Icon name="BookOpen" size={14} /> {post.read} পড়া</p>
        <div className="mt-6 flex aspect-video items-center justify-center rounded-xl2 bg-brand-light text-brand">
          <Icon name="FileText" size={56} />
        </div>
        <div className="prose-bn mt-8">
          <p className="text-lg">{post.excerpt}</p>
          <p>এই আর্টিকেলটি শীঘ্রই সম্পূর্ণ কন্টেন্টসহ প্রকাশিত হবে। Apple Network-এর ব্লগে আমরা ফোন কেনা, যত্ন ও স্মার্ট সিদ্ধান্তের ব্যবহারিক গাইড শেয়ার করি — যাতে আপনি সঠিক পছন্দ করতে পারেন।</p>
          <h2>মূল পয়েন্ট</h2>
          <ul>
            <li>স্বচ্ছ তথ্য ও সৎ পরামর্শ — কোনো লুকানো কথা নেই।</li>
            <li>বাংলাদেশের বাজারের প্রেক্ষাপটে বাস্তব উদাহরণ।</li>
            <li>নতুন ও প্রিলাভড — দুই ক্ষেত্রেই কীভাবে সেরা ভ্যালু পাবেন।</li>
          </ul>
        </div>
        <div className="mt-8 flex flex-wrap gap-3 rounded-xl2 bg-brand-light p-6">
          <Link href="/category/phones" className="btn-primary">ফোন দেখুন</Link>
          <Link href="/blog" className="btn-secondary">আরও আর্টিকেল</Link>
        </div>
      </article>
    </>
  );
}
