// app/admin/messages/page.jsx — customer messages / inquiries inbox (Phase A)
import { createClient } from "@/lib/supabase/server";
import MessageCard from "./MessageCard";

export const dynamic = "force-dynamic";

export default async function AdminMessages() {
  const sb = await createClient();
  const { data: msgs } = await sb
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  const newCount = msgs?.filter((m) => m.status === "new").length ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">কাস্টমার মেসেজ</h1>
      <p className="mt-1 text-sm text-ink-muted">{newCount} টি নতুন · মোট {msgs?.length ?? 0}</p>

      <div className="mt-6 space-y-3">
        {msgs?.map((m) => <MessageCard key={m.id} msg={m} />)}
        {!msgs?.length && (
          <p className="rounded-lg bg-white p-8 text-center text-sm text-ink-muted">কোনো মেসেজ নেই।</p>
        )}
      </div>
    </div>
  );
}
