// app/admin/crm/page.jsx — CRM: searchable/filterable customer list (owner-only).
import { createClient } from "@/lib/supabase/server";
import CRMCustomerRow from "./CRMCustomerRow";

export const dynamic = "force-dynamic";

const TYPE_OPTIONS = [
  { value: "", label: "সব ধরন" },
  { value: "walk-in", label: "ওয়াক-ইন" },
  { value: "credit", label: "ক্রেডিট" },
  { value: "emi", label: "ইমি" },
  { value: "online", label: "অনলাইন" },
];

export default async function CRMListPage({
  searchParams,
}) {
  const sb = await createClient();
  const q = (searchParams.q || "").trim();
  const type = (searchParams.type || "").trim();

  // Lightweight customer list to avoid PostgREST subquery parsing issues.
  const baseColumns = "id, name, phone, email, type, note, created_at";

  let query = sb
    .from("customers")
    .select(baseColumns);

  if (q) {
    query = query.or(`phone.ilike.%${q}`, `name.ilike.%${q}`);
  }
  if (type) {
    query = query.eq("type", type);
  }

  query = query.order("created_at", { ascending: false });

  let customers = [];
  let queryError = null;
  try {
    const res = await query;
    customers = res.data || [];
    queryError = res.error || null;
  } catch (e) {
    queryError = e;
  }

  if (queryError) {
    console.error("CRM list query failed:", queryError);
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p>কাস্টমার তালিকা লোড করতে ব্যর্থ — পেজ রিফ্রেশ করে আবার চেষ্টা করুন।</p>
        <p className="mt-2 text-xs opacity-80">{String(queryError?.message || queryError)}</p>
      </div>
    );
  }

  const rows = customers;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">কাস্টমার (CRM)</h1>
          <p className="mt-1 text-sm text-ink-muted">{rows.length} জন কাস্টমার</p>
        </div>
        <form className="flex flex-wrap items-center gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="ফোন বা নামে খুঁজুন…"
            className="min-w-[200px] rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          />
          <select
            name="type"
            defaultValue={type}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            ফিল্টার
          </button>
          {q || type ? (
            <a href="/admin/crm" className="text-sm text-brand hover:underline">
              সব প্রদর্শন
            </a>
          ) : null}
        </form>
      </div>

      {/* summary strip */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <span className="rounded-lg bg-white px-3 py-1.5 border border-gray-100 text-ink-muted">
          মোট: <strong className="text-ink">{rows.length}</strong>
        </span>
        <span className="rounded-lg bg-white px-3 py-1.5 border border-gray-100 text-ink-muted">
          ক্রেডিট/ইমি:{" "}
          <strong className="text-ink">
            {rows.filter((r) => r.type === "credit" || r.type === "emi").length}
          </strong>
        </span>
      </div>

      {/* list */}
      <div className="space-y-2">
        {rows.map((c) => (
          <CRMCustomerRow key={c.id} c={c} />
        ))}
        {!rows.length && (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center text-ink-muted">
            <p className="text-lg">কোনো কাস্টমার পাওয়া যায়নি</p>
            <p className="mt-1 text-sm">ফোন নম্বর দিয়ে সার্চ করুন অথবা ফিল্টার পরিবর্তন করুন।</p>
          </div>
        )}
      </div>
    </div>
  );
}
