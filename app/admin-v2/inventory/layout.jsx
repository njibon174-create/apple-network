// app/admin-v2/inventory/layout.jsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function InventoryLayout({ children }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "owner") redirect("/login");

  return <div className="space-y-6">{children}</div>;
}
