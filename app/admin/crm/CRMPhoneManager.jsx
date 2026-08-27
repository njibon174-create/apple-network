// app/admin/crm/CRMPhoneManager.jsx — add / remove / set-primary phones (client).
"use client";
import { useState } from "react";
import { addPhone, removePhone, setPrimaryPhone } from "@/app/actions/crm";

export default function CRMPhoneManager({ customer }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ phone: "", label: "" });

  const phones = customer.phones || [];
  const otherPhones = phones.filter((p) => !p.is_primary);
  const primaryPhone = phones.find((p) => p.is_primary) || phones[0];

  async function handleAdd() {
    if (!form.phone.trim()) return;
    setBusy(true);
    setMsg(null);
    const res = await addPhone(customer.id, { phone: form.phone, label: form.label || null });
    setBusy(false);
    if (res?.error) setMsg(res.error);
    else {
      setMsg("ফোন যোগ হয়েছে");
      setForm({ phone: "", label: "" });
      setTimeout(() => setMsg(null), 2500);
    }
  }

  async function handleRemove(phoneId, phone) {
    if (!window.confirm(`নম্বর ${phone} মুছবেন?`)) return;
    setBusy(true);
    setMsg(null);
    const res = await removePhone(customer.id, phoneId);
    setBusy(false);
    if (res?.error) setMsg(res.error);
    else {
      setMsg("ফোন মুছে গেছে");
      setTimeout(() => setMsg(null), 2500);
    }
  }

  async function handleSetPrimary(phoneId, phone) {
    setBusy(true);
    setMsg(null);
    const res = await setPrimaryPhone(customer.id, phoneId);
    setBusy(false);
    if (res?.error) setMsg(res.error);
    else {
      setMsg(`প্রাথমিক ফোন: ${phone}`);
      setTimeout(() => setMsg(null), 2500);
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-medium text-ink">
          <svg className="h-5 w-5 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
          </svg>
          ফোন নম্বর
        </h3>
        <span className="text-xs text-ink-muted">
          {phones.length}টি নম্বর ({phones.filter((p) => p.is_primary).length}টি প্রাথমিক)
        </span>
      </div>

      {/* primary phone display */}
      <div className="mt-4 rounded-lg bg-brand/5 border border-brand/10 p-3">
        <p className="text-xs text-brand font-medium">প্রাথমিক নম্বর</p>
        {primaryPhone ? (
          <div className="mt-1 flex items-center justify-between">
            <span className="text-ink font-semibold break-all">{primaryPhone.phone}</span>
            {primaryPhone.label && (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                {primaryPhone.label}
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">কোনো ফোন নম্বর নেই</p>
        )}
      </div>

      {/* other phones */}
      {otherPhones.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {otherPhones.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink break-all">{p.phone}</span>
                {p.label && (
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-ink-muted">
                    {p.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!p.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(p.id, p.phone)}
                    className="text-xs text-brand hover:underline"
                    title="একে প্রাথমিক নম্বর করুন"
                  >
                    প্রাথমিক করুন
                  </button>
                )}
                <button
                  onClick={() => handleRemove(p.id, p.phone)}
                  className="text-xs text-red-500 hover:underline"
                >
                  মুছুন
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!otherPhones.length && !primaryPhone && (
        <p className="mt-3 text-sm text-ink-muted">এখনও কোনো ফোন নম্বর যোগ করা হয়নি।</p>
      )}

      {/* add form */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="নতুন নম্বর (যেমন: 017xxxxxxxx)"
          className="flex-1 min-w-[160px] rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          placeholder="লেবেল (চ্ছিক)"
          className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          disabled={busy || !form.phone.trim()}
          onClick={handleAdd}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {busy ? "যোগ করা হচ্ছে…" : "যোগ করুন"}
        </button>
      </div>

      {msg && (
        <p className="mt-2 rounded-lg bg-gray-50 p-2 text-sm text-ink-soft">{msg}</p>
      )}
    </div>
  );
}
