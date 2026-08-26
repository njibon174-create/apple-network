// components/admin/DeleteProductButton.jsx — client delete trigger (owner-only).
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/app/actions/products";

export default function DeleteProductButton({ id }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (busy) return;
    if (!confirm("প্রোডাক্ট ডিলিট করবেন?")) return;
    setBusy(true);
    await deleteProduct(id);
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
    >
      ডিলিট
    </button>
  );
}
