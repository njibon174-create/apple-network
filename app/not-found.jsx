// app/not-found.jsx — PAGE 16: 404
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-7xl font-bold text-brand">৪০৪</p>
      <h1 className="mt-4 text-xl font-bold text-ink">পেজটি পাওয়া যায়নি</h1>
      <p className="mt-2 max-w-md text-sm text-ink-muted">আপনি যে পেজটি খুঁজছিলেন সেটা এখানে নেই বা সরানো হয়েছে। চিন্তা নেই — নিচের যেকোনো লিংকে ফিরে যান।</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">হোমপেজে যান</Link>
        <Link href="/category/phones" className="btn-secondary">ফোন দেখুন</Link>
        <Link href="/category/accessories" className="btn-ghost">অ্যাক্সেসরিজ</Link>
        <Link href="/contact" className="btn-ghost">যোগাযোগ</Link>
      </div>
    </div>
  );
}
