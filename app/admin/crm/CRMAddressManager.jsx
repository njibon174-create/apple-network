// app/admin/crm/CRMAddressManager.jsx — add / edit / remove addresses (client).
"use client";
import { useState } from "react";
import { addAddress, updateAddress, removeAddress } from "@/app/actions/crm";

const DIVISIONS = [
  "", "ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "বরিশাল", "সিলেট", "ময়মনসিংহ", "যশোর"
];
const LABELS = ["বাড়ি", "অফিস", "অন্য"];

export default function CRMAddressManager({ customer }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    label: "বাড়ি",
    full_address: "",
    area: "",
    city: "",
    division: "",
    zip: "",
    phone: "",
    is_default: false,
  });

  function openAdd() {
    setForm({
      label: "বাড়ি",
      full_address: "",
      area: "",
      city: "",
      division: "",
      zip: "",
      phone: "",
      is_default: false,
    });
    setEditing(null);
    setShowAdd(true);
  }

  function closeAdd() {
    setShowAdd(false);
    setEditing(null);
  }

  async function handleSave() {
    if (!form.full_address.trim()) return;
    setBusy(true);
    setMsg(null);
    const res =
      editing
        ? await updateAddress(customer.id, editing.id, form)
        : await addAddress(customer.id, form);
    setBusy(false);
    if (res?.error) setMsg(res.error);
    else {
      setMsg(editing ? "ঠিকানা আপডেট হয়েছে" : "ঠিকানা যোগ হয়েছে");
      closeAdd();
      setTimeout(() => setMsg(null), 2500);
    }
  }

  async function handleRemove(id) {
    if (!window.confirm("এই ঠিকানাটি মুছবেন?")) return;
    setBusy(true);
    setMsg(null);
    const res = await removeAddress(customer.id, id);
    setBusy(false);
    if (res?.error) setMsg(res.error);
    else {
      setMsg("ঠিকানা মুছে গেছে");
      setTimeout(() => setMsg(null), 2500);
    }
  }

  const addresses = customer.addresses || [];

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-medium text-ink">
          <svg className="h-5 w-5 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          ঠিকানা
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">
            {addresses.length}টি ঠিকানা
          </span>
          <button
            onClick={openAdd}
            className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            যোগ করুন
          </button>
        </div>
      </div>

      {/* existing addresses */}
      {addresses.length > 0 && (
        <ul className="mt-4 space-y-3">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="rounded-lg bg-gray-50 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{a.label || "বাড়ি"}</span>
                    {a.is_default && (
                      <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-xs text-brand">
                        ডিফল্ট
                      </span>
                    )}
                    {a.division && (
                      <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-xs text-ink-muted">
                        {a.division}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ink-soft break-words">{a.full_address}</p>
                  {a.area && <p className="mt-0.5 text-xs text-ink-muted">{a.area}</p>}
                  {a.city && <p className="mt-0.5 text-xs text-ink-muted">{a.city}</p>}
                  {a.phone && <p className="mt-1 text-xs text-ink-muted">
                    <span className="font-medium text-ink">যোগাযোগ:</span> {a.phone}
                  </p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => {
                      setForm({
                        label: a.label || "বাড়ি",
                        full_address: a.full_address,
                        area: a.area || "",
                        city: a.city || "",
                        division: a.division || "",
                        zip: a.zip || "",
                        phone: a.phone || "",
                        is_default: a.is_default,
                      });
                      setEditing(a);
                      setShowAdd(true);
                    }}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-ink-soft hover:bg-gray-100"
                  >
                    সম্পাদন
                  </button>
                  <button
                    onClick={() => handleRemove(a.id)}
                    className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    মুছুন
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!addresses.length && !showAdd && (
        <div className="mt-3 rounded-lg bg-gray-50 p-4 text-center text-sm text-ink-muted">
          এখনও কোনো ঠিকানা নেই। উপরে "যোগ করুন" চাপুন।
        </div>
      )}

      {/* add / edit form */}
      {showAdd && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-ink">
              {editing ? "ঠিকানা সম্পাদন" : "নতুন ঠিকানা যোগ"}
            </p>
            <button onClick={closeAdd} className="text-xs text-ink-muted hover:underline">
              বাতিল
            </button>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <label className="w-24 text-ink-muted">লেবেল</label>
              <select
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="w-28 rounded-lg border border-gray-200 px-2 py-1.5"
              >
                {LABELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <label className="w-14 text-ink-muted">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
                  className="mr-1"
                />
                ডিফল্ট
              </label>
            </div>

            <div>
              <label className="text-ink-muted">ঠিকানা (বাধ্যতামূলক)</label>
              <textarea
                value={form.full_address}
                onChange={(e) => setForm((f) => ({ ...f, full_address: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 resize-none"
                placeholder="হাড়াপাড়া, হোসে-পোসা, বিল্ডিং-ফ্ল্যাট-নম্বর…"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-ink-muted">এলাকা</label>
                <input
                  type="text"
                  value={form.area}
                  onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5"
                  placeholder="যেমন: গাজীপুর চত্বর"
                />
              </div>
              <div>
                <label className="text-ink-muted">শহর</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5"
                  placeholder="গাজীপুর, ঢাকা…"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-ink-muted">বিভাগ</label>
                <select
                  value={form.division}
                  onChange={(e) => setForm((f) => ({ ...f, division: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5"
                >
                  {DIVISIONS.map((d) => (
                    <option key={d} value={d}>{d || "নির্বাচন করুন"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-ink-muted">পোষ্টাল কোড</label>
                <input
                  type="text"
                  value={form.zip}
                  onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5"
                  placeholder="১৭০০"
                />
              </div>
              <div>
                <label className="text-ink-muted">যোগাযোগ নম্বর</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5"
                  placeholder="017xxxxxxxx"
                />
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              disabled={busy || !form.full_address.trim()}
              onClick={handleSave}
              className="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {busy ? "সেভ করা হচ্ছে…" : (editing ? "আপডেট" : "যোগ করুন")}
            </button>
          </div>

          {msg && <p className="mt-2 rounded-lg bg-gray-50 p-2 text-sm text-ink-soft">{msg}</p>}
        </div>
      )}
    </div>
  );
}
