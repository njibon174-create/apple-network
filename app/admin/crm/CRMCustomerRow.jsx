// app/admin/crm/CRMCustomerRow.jsx — one customer row in the list (client, actions).
"use client";
import Link from "next/link";
import { updateCustomerProfile, changeCustomerType } from "@/app/actions/crm";
import { taka } from "@/lib/data";
import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPE_COLOR = {
  "walk-in": "bg-gray-100 text-ink-muted",
  credit: "bg-amber-100 text-amber-700",
  emi: "bg-blue-100 text-blue-700",
  online: "bg-green-100 text-green-700",
};
const TYPE_LABEL = {
  "walk-in": "ওয়াক-ইন",
  credit: "ক্রেডিট",
  emi: "ইমি",
  online: "অনলাইন",
};
const TYPE_OPTIONS = [
  { value: "walk-in", label: "ওয়াক-ইন" },
  { value: "credit", label: "ক্রেডিট" },
  { value: "emi", label: "ইমি" },
  { value: "online", label: "অনলাইন" },
];

export default function CRMCustomerRow({ c }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [editingType, setEditingType] = useState(false);
  const [nextType, setNextType] = useState(c.type);
  const [name, setName] = useState(c.name);
  const [note, setNote] = useState(c.note || "");

  const spent = c.total_spent || 0;
  const overdueCount = 0;
  const isLate = false;

  async function saveProfile() {
    setBusy(true);
    setMsg(null);
    const res = await updateCustomerProfile(c.id, {
      name: name || "—",
      note: note || null,
    });
    setBusy(false);
    if (res?.error) setMsg(res.error);
    else {
      setMsg("প্রোফাইল আপডেট হয়েছে");
      router.refresh();
      setTimeout(() => setMsg(null), 2500);
    }
  }

  async function saveType() {
    setBusy(true);
    setMsg(null);
    const res = await changeCustomerType(c.id, nextType, "অ্যাডমিন প্রোফাইল থেকে পরিবর্তন");
    setBusy(false);
    setEditingType(false);
    if (res?.error) setMsg(res.error);
    else {
      setMsg(`টাইপ পরিবর্তন: ${TYPE_LABEL[nextType] || nextType}`);
      router.refresh();
      setTimeout(() => setMsg(null), 2500);
    }
  }

  return (
    <div className="group rounded-xl border border-gray-100 bg-white p-4 transition hover:border-gray-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/admin/crm/${c.id}`}
              className="font-semibold text-ink hover:text-brand truncate"
            >
              {c.name || "—"}
            </Link>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[c.type] || TYPE_COLOR["walk-in"]}`}>
              {TYPE_LABEL[c.type] || c.type}
            </span>
            {isLate && (
              <span className="flex items-center gap-1 text-red-500 text-xs">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L1 21h22L12 2zm0 4l7.5 13.5H4.5L12 6zm0 0L7.5 19.5h9L12 6z" />
                </svg>
                {overdueCount > 0 ? `${overdueCount}টি ওভারডু` : "বাকি আছে"}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
            <span className="truncate">{c.phone || ""}</span>
            {c.email && <span>{c.email}</span>}
            <span className="text-ink-soft">
              {c.order_count || 0}টি অর্ডার · {taka(spent)}
            </span>
          </div>

          {c.note && <p className="mt-1.5 text-xs text-ink-soft line-clamp-1">{c.note}</p>}
        </div>

        <div className="text-right text-sm flex-shrink-0">
          <p className="text-ink-muted">ফোন: {c.phone_count || 0}টি</p>
          <p className="text-ink-muted">ঠিকানা: {c.address_count || 0}টি</p>
        </div>
      </div>

      {/* inline actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-50 pt-3">
        <Link
          href={`/admin/crm/${c.id}`}
          className="rounded-lg bg-brand/80 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand hover:text-white"
        >
          বিস্তারিত দেখুন
        </Link>

        {/* quick name/note edit */}
        {editingType ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={nextType}
              onChange={(e) => setNextType(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              disabled={busy}
              onClick={saveType}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? "…" : "সেভ"}
            </button>
            <button
              onClick={() => { setEditingType(false); setMsg(null); }}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-ink-soft"
            >
              বাতিল
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingType(true)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-ink-soft hover:bg-gray-50"
          >
            টাইপ পরিবর্তন
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setMsg(null)}
            className="text-xs text-ink-muted hover:text-ink"
          >
            {msg ? "বার্তা লুকাও" : "অ্যাকশন"}
          </button>
          {msg && (
            <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs text-ink-soft">
              {msg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
