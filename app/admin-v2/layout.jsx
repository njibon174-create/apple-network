// app/admin-v2/layout.jsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Icon from "@/components/Icon";

export default async function AdminV2Layout({ children }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await sb
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "owner") redirect("/login");

  const nav = [
    { href: "/admin-v2", label: "কন্ট্রোল সেন্টার", icon: "LayoutDashboard", active: true },
    { href: "/admin-v2/finance", label: "ফিন্যান্স হাব", icon: "Wallet" },
    { href: "/admin-v2/inventory", label: "ইনভেন্টরি কন্ট্রোলার", icon: "Package" },
    { href: "/admin-v2/customers", label: "কাস্টমার ইঞ্জিন", icon: "Users" },
    { href: "/admin-v2/orders", label: "অর্ডার কমান্ড", icon: "ShoppingBag" },
    { href: "/admin-v2/reports", label: "রিপোর্টস", icon: "BarChart3" },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-gray-200 bg-white z-50">
        <div className="flex h-16 items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white font-bold">A</div>
            <span className="text-lg font-bold text-ink tracking-tight">Apple <span className="text-brand">Network</span></span>
          </div>
        </div>
        
        <nav className="p-4 space-y-1">
          <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Main Menu</p>
          {nav.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 hover:text-brand group"
            >
              <Icon name={item.icon} size={18} className="text-gray-400 group-hover:text-brand transition-colors" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-gray-200" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-ink truncate">{profile.full_name || user.email}</p>
              <p className="text-[10px] text-gray-400 uppercase">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 px-8 backdrop-blur-md">
          <div className="relative w-96">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Icon name="Search" size={16} className="text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search anything... (Cmd+K)" 
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-brand focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              System Live
            </div>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
