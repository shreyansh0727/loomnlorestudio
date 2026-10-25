import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { getSiteSettings } from "@/lib/data/content";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${settings.brandName} — Handmade hair accessories`,
      template: `%s · ${settings.brandName}`,
    },
    description:
      "Handmade scrunchies, hair bows, fashion ties, headbands and crochet accessories, crafted in Varanasi. Soft pastel palettes for retail and wholesale.",
    openGraph: {
      type: "website",
      siteName: settings.brandName,
      title: `${settings.brandName} — Handmade hair accessories`,
      description:
        "Handmade scrunchies, bows, ties and crochet accessories crafted with care in Varanasi.",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#fdf6f3",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable} ${caveat.variable}`}
    >
      <body>
        {children}
        <Toaster
          position="bottom-center"
          closeButton
          toastOptions={{
            style: {
              background: "#fffdfb",
              color: "#462f3a",
              border: "1px solid #eedbd8",
              borderRadius: "1rem",
              fontFamily: "var(--font-manrope)",
            },
          }}
        />
      </body>
    </html>
  );
}
