// components/ProductCard.jsx
// Why: the core reusable product tile used in grids across shop/category/search/home.
import Link from "next/link";
import Image from "next/image";
import { taka } from "@/lib/data";
import Icon from "@/components/Icon";

// Map a stored badge key -> { icon, label } (no emoji).
const BADGES = {
  hot: { icon: "Flame", label: "হট" },
  top: { icon: "TrendingUp", label: "টপ সেলিং" },
  demand: { icon: "ThumbsUp", label: "হাই ডিমান্ড" },
  choice: { icon: "Heart", label: "কাস্টমারস চয়েস" },
  excellent: { icon: "BadgeCheck", label: "Excellent" },
  good: { icon: "BadgeCheck", label: "Good" },
};

export default function ProductCard({ p }) {
  const off = p.regularPrice ? Math.round((1 - p.price / p.regularPrice) * 100) : 0;
  const badge = p.badge ? BADGES[p.badge] : null;
  return (
    <Link href={`/product/${p.slug}`} className="card group flex flex-col overflow-hidden">
      {/* Real product image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Image
          src={p.image || "/images/products/samsung.png"}
          alt={p.name}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
        />
        {badge && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-xs font-semibold text-ink shadow-sm">
            <Icon name={badge.icon} size={12} className="text-brand" /> {badge.label}
          </span>
        )}
        {off > 0 && (
          <span className="absolute right-2 top-2 rounded-md bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
            -{off}%
          </span>
        )}
        {!p.inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs font-medium text-white">
            স্টক আউট — প্রি-অর্ডার
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs text-ink-muted">{p.brand}</p>
        <h3 className="line-clamp-2 text-sm font-semibold text-ink group-hover:text-brand">{p.name}</h3>

        {p.storage && (
          <p className="mt-1 text-xs text-ink-muted">
            {p.storage}{p.ram ? ` · ${p.ram}` : ""}
          </p>
        )}

        <div className="mt-2 flex items-end gap-2">
          <span className="text-base font-bold text-brand">{taka(p.price)}</span>
          {p.regularPrice && (
            <span className="text-xs text-ink-muted line-through">{taka(p.regularPrice)}</span>
          )}
        </div>

        {p.emiFrom && (
          <p className="mt-0.5 text-xs text-accent-teal">EMI ৳{p.emiFrom.toLocaleString("bn-BD")}/মাস থেকে</p>
        )}

        <div className="mt-auto flex items-center gap-1 pt-2 text-xs text-ink-muted">
          <Icon name="Star" size={12} className="fill-accent-yellow text-accent-yellow" />
          <span>{(p.rating || 0).toLocaleString("bn-BD")}</span>
          <span>({(p.reviews || 0).toLocaleString("bn-BD")})</span>
        </div>
      </div>
    </Link>
  );
}
