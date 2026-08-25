// app/login/page.jsx — Admin login (owner only)
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Icon from "@/components/Icon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const sb = createClient();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("লগইন ব্যর্থ: " + error.message);
      return;
    }
    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold text-brand">Apple Network</p>
          <h1 className="mt-1 text-xl font-bold text-ink">অ্যাডমিন লগইন</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-ink-soft">ইমেইল</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" placeholder="owner@applenetwork.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-soft">পাসওয়ার্ড</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" placeholder="••••••••" />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="btn-primary w-full justify-center">
            {loading ? "লোড হচ্ছে…" : (<><Icon name="LogIn" size={16} /> লগইন করুন</>)}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-ink-muted"><Link href="/" className="hover:underline">সাইটে ফিরে যান</Link></p>
      </div>
    </div>
  );
}
