// app/actions/messages.js — server actions for inquiries
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function replyToMessage(id, reply) {
  try {
    const sb = await createClient();
    const status = reply?.trim() ? "replied" : "new";
    await sb.from("inquiries").update({ admin_reply: reply, status, updated_at: new Date().toISOString() }).eq("id", id);
    revalidatePath("/admin/messages");
    revalidatePath("/admin");
  } catch (error) {
    console.error("Error in messages.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function closeMessage(id) {
  try {
    const sb = await createClient();
    await sb.from("inquiries").update({ status: "closed", updated_at: new Date().toISOString() }).eq("id", id);
    revalidatePath("/admin/messages");
    revalidatePath("/admin");
  } catch (error) {
    console.error("Error in messages.js:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}
