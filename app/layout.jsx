// app/layout.jsx
// Why: root layout — global metadata (SEO) + fonts. The store Header/Footer are
// rendered by SiteChrome, which hides them on /admin and /login.
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";

export const metadata = {
  metadataBase: new URL("https://apple-network.bd"),
  title: {
    default: "Apple Network — New & Used Phones, Accessories & Electronics in Bangladesh",
    template: "%s | Apple Network",
  },
  description:
    "Apple Network is Bangladesh's trusted destination for brand new and pre-loved phones (official & unofficial), accessories, laptops, tablets, smartwatches and more — free delivery, EMI up to 36 months, exchange offers.",
  keywords: ["buy phones online Bangladesh", "used phone price Bangladesh", "EMI phone BD", "mobile accessories Bangladesh", "Apple Network"],
  openGraph: {
    type: "website",
    locale: "bn_BD",
    siteName: "Apple Network",
    title: "Apple Network — Your Trusted Phone & Electronics Store in Bangladesh",
    description: "Brand new & used phones, official and unofficial. Accessories, laptops, tablets, smartwatches. Free delivery across Bangladesh. EMI available.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apple Network — Buy New & Used Phones in Bangladesh",
    description: "Trusted store for new & pre-loved phones, accessories & electronics. EMI, exchange offers, free delivery.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body>
        <SiteChrome />
        <main className="min-h-[60vh]">{children}</main>
      </body>
    </html>
  );
}
