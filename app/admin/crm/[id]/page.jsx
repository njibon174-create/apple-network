// app/admin/crm/[id]/page.jsx — CRM customer detail: profile card, phones, addresses,
// type history, and full activity log (owner-only).
import { notFound } from "next/navigation";
import { getCustomer } from "@/app/actions/crm";
import CRMPhoneManager from "../CRMPhoneManager";
import CRMAddressManager from "../CRMAddressManager";
import CRMActivityLog from "../CRMActivityLog";
import { taka } from "@/lib/data";

export const dynamic = "force-dynamic";

const TYPE_LABEL = {
  "walk-in": "ওয়াক-ইন",
  credit: "ক্রেডিট",
  emi: "ইমি",
  online: "অনলাইন",
};
const TYPE_COLOR = {
  "walk-in": "bg-gray-100 text-ink-muted",
  credit: "bg-amber-100 text-amber-700",
  emi: "bg-blue-100 text-blue-700",
  online: "bg-green-100 text-green-700",
};

export async function generateMetadata({ params }) {
  const c = await getCustomer(params.id);
  if (!c) return {};
  return { title: `কাস্টমার: ${c.name || c.phone}` };
}

export default async function CRMDetailPage({ params }) {
  const customer = await getCustomer(params.id);
  if (!customer) notFound();

  const ordersTotal = 0; // rendered via separate query on the detail components if needed

  return (
    <div>
      {/* breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-ink-muted">
        <a href="/admin/crm" className="hover:text-ink">
          কাস্টমার তালিকা
        </a>
        <span className="">/</span>
        <span className="truncate text-ink">{customer.phone || customer.name}</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* left column: profile + stats */}
        <div className="col-span-1 space-y-6">
          {/* profile card */}
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-ink break-all">
                    {customer.name || "—"}
                  </h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[customer.type] || TYPE_COLOR["walk-in"]}`}
                  >
                    {TYPE_LABEL[customer.type] || customer.type}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-soft break-all">{customer.phone || ""}</p>
                {customer.email && (
                  <p className="mt-0.5 text-xs text-ink-muted break-all">{customer.email}</p>
                )}
                <p className="mt-2 text-xs text-ink-muted">
                  কাস্টমার যাত্রা:{" "}
                  {new Date(customer.created_at).toLocaleDateString("bn-BD", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              {customer.note && (
                <div className="rounded-lg max-w-[140px] bg-gray-50 p-2 text-xs text-ink-soft">
                  <p className="font-medium text-ink-muted">নোট</p>
                  <p className="mt-0.5 break-words">{customer.note}</p>
                </div>
              )}
            </div>

            {/* phone count badge */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {customer.phones.length > 1 && (
                <span className="rounded bg-brand/10 px-2 py-0.5 text-brand">
                  {customer.phones.length}টি ফোন
                </span>
              )}
              {customer.addresses.length > 0 && (
                <span className="rounded bg-gray-100 px-2 py-0.5 text-ink-muted">
                  {customer.addresses.length}টি ঠিকানা
                </span>
              )}
            </div>
          </div>

          {/* quick stat cards */}
          <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white border border-gray-100 p-3">
            <p className="text-xs text-ink-muted">মোট অর্ডার</p>
            <p className="text-2xl font-bold text-ink">{customer.orders?.length || 0}</p>
          </div>
          <div className="rounded-xl bg-white border border-gray-100 p-3">
            <p className="text-xs text-ink-muted">মোট খরচ</p>
            <p className="text-2xl font-bold text-brand">
              {taka(customer.total_spent || 0)}
            </p>
          </div>
          <div className="rounded-xl bg-white border border-gray-100 p-3 col-span-2">
            <p className="text-xs text-ink-muted">বর্তমান বাকি (ক্রেডিট + EMI)</p>
            <p
              className={`text-2xl font-bold ${(customer.credit_outstanding || 0) > 0 ? "text-red-600" : "text-green-600"}`}
            >
              {taka(customer.credit_outstanding || 0)}
            </p>
          </div>
          {customer.credit_sales?.length > 0 && (
            <div className="rounded-xl bg-white border border-gray-100 p-3 col-span-2 mt-3">
              <p className="text-xs text-ink-muted mb-2">ক্রেডিট সেলস হিস্ট্রি</p>
              <div className="space-y-1 text-xs">
                {customer.credit_sales.map((cs) => (
                  <div key={cs.id} className="flex justify-between border-b border-gray-50 py-1">
                    <span className="text-ink-muted">
                      {taka(cs.total_due)} · {cs.status === "paid" ? "পরিশোধিত" : cs.status === "partial" ? "আংশিক" : "বাকি"}
                    </span>
                    <span className={cs.status === "paid" ? "text-green-600" : cs.status === "partial" ? "text-amber-600" : "text-red-600"}>
                      {taka(cs.total_due - cs.amount_paid)} বাকি
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>

          {/* type history */}
          {customer.typeLog.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
                <svg className="h-4 w-4 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                টাইপ ইতিহাস
              </h3>
              <ol className="space-y-2 text-sm">
                {customer.typeLog.map((tl) => (
                  <li key={tl.id} className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                        tl.to_type === "credit"
                          ? "bg-amber-100 text-amber-700"
                          : tl.to_type === "emi"
                          ? "bg-blue-100 text-blue-700"
                          : tl.to_type === "online"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-ink-muted"
                      }`}
                    >
                      {TYPE_LABEL[tl.to_type] || tl.to_type}
                    </span>
                    <span className="text-ink-muted">
                      {tl.from_type ? ` ${tl.from_type} থেকে` : ""}
                    </span>
                    {tl.reason && <span className="text-ink-soft"> — {tl.reason}</span>}
                    <span className="ml-auto text-xs text-ink-muted">
                      {new Date(tl.created_at).toLocaleDateString("bn-BD")}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* right column: editable sections */}
        <div className="col-span-2 space-y-6">
          {/* phones */}
          <CRMPhoneManager customer={customer} />

          {/* addresses */}
          <CRMAddressManager customer={customer} />

          {/* activity log — full */}
          <CRMActivityLog activities={customer.activities} customer={customer} />
        </div>
      </div>
    </div>
  );
}
