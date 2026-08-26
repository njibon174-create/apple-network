// app/admin/layout.jsx — protects /admin and enforces owner role (server-side).
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import Icon from "@/components/Icon";

export default async function AdminLayout({ children }) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await sb
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "owner") redirect("/login");

  const nav = [
    { href: "/admin", label: "ড্যাশবোর্ড", icon: "LayoutDashboard" },
    { href: "/admin/orders", label: "অর্ডার", icon: "ShoppingBag" },
    { href: "/admin/messages", label: "মেসেজ", icon: "MessageSquare" },
    { href: "/admin/stock/add", label: "নতুন স্টক", icon: "Plus" },
    { href: "/admin/stock", label: "ইনভেন্টরি", icon: "Package" },
    { href: "/admin/purchases", label: "ক্রয় (সাপ্লায়ার)", icon: "Truck" },
    { href: "/admin/cash", label: "ক্যাশ বুক", icon: "Wallet" },
    { href: "/admin/expenses", label: "খরচ", icon: "Receipt" },
    { href: "/admin/returns", label: "রিটার্ন", icon: "Undo2" },
    { href: "/admin/reports", label: "প্রফিট-লস", icon: "BarChart3" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed inset-y-0 left-0 w-60 border-r border-gray-200 bg-white p-4">
        <p className="mb-6 px-2 text-lg font-bold text-brand">Apple Network</p>
        <nav className="space-y-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-gray-100">
              <Icon name={n.icon} size={16} /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t border-gray-100 pt-4">
          <p className="px-2 text-xs text-ink-muted">{profile.full_name || user.email}</p>
          <form action={logout}>
            <button className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50">
              <Icon name="LogOut" size={16} /> লগআউট
            </button>
          </form>
          <Link href="/" className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted transition hover:bg-gray-100">
            <Icon name="ExternalLink" size={16} /> সাইট দেখুন
          </Link>
        </div>
      </aside>
      <main className="ml-60 p-6">{children}</main>
    </div>
  );
}
