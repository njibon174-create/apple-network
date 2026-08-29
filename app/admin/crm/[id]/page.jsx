// app/admin/crm/[id]/page.jsx — CRM customer detail: profile card, phones, addresses,
// type history, and full activity log (owner-only).
import { notFound } from "next/navigation";
import { getCustomer } from "@/app/actions/crm";
import { getProducts } from "@/lib/store";
import CRMPhoneManager from "../CRMPhoneManager";
import CRMAddressManager from "../CRMAddressManager";
import CRMActivityLog from "../CRMActivityLog";
import CRMProfileSection from "../CRMProfileSection";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const c = await getCustomer(params.id);
  if (!c) return {};
  return { title: `কাস্টমার: ${c.name || c.phone}` };
}

export default async function CRMDetailPage({ params }) {
  const customer = await getCustomer(params.id);
  if (!customer) notFound();

  // Fetch products for the Quick Sell modal
  const products = await getProducts();

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
        {/* Profile and Stats Section (Client Component for Quick Sell) */}
        <CRMProfileSection customer={customer} products={products} />

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
