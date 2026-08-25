// app/actions/auth.js — server actions for admin auth
"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const sb = await createClient();
  await sb.auth.signOut();
  redirect("/login");
}

// Called after login to create an owner profile if missing (e.g. first owner).
export async function ensureOwnerProfile() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return;
  const { data: existing } = await sb.from("profiles").select("id").eq("id", user.id).single();
  if (!existing) {
    await sb.from("profiles").insert({ id: user.id, role: "owner", full_name: user.email });
  }
  revalidatePath("/admin");
}
