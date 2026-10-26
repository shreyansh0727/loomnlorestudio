import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { getSiteSettings } from "@/lib/data/content";
import { SITE_URL } from "@/lib/env";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/seo";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
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
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: settings.brandName,
    category: "shopping",
    title: {
      default: `${settings.brandName} — Handmade hair accessories`,
      template: `%s · ${settings.brandName}`,
    },
    description:
      "Handmade scrunchies, hair bows, fashion ties, headbands and crochet accessories, crafted in Varanasi. Soft pastel palettes for retail and wholesale.",
    openGraph: {
      type: "website",
      siteName: settings.brandName,
      locale: "en_IN",
      title: `${settings.brandName} — Handmade hair accessories`,
      description:
        "Handmade scrunchies, bows, ties and crochet accessories crafted with care in Varanasi.",
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `${settings.brandName} — Handmade hair accessories`,
      description:
        "Handmade scrunchies, bows, ties and crochet accessories crafted with care in Varanasi.",
      images: [DEFAULT_SOCIAL_IMAGE.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#fdf6f3",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${fraunces.variable} ${manrope.variable} ${caveat.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {children}
        <Toaster
          position="bottom-center"
          closeButton
          toastOptions={{
            style: {
              background: "var(--color-cream)",
              color: "var(--color-ink)",
              border: "1px solid var(--color-line)",
              borderRadius: "1rem",
              fontFamily: "var(--font-manrope)",
            },
          }}
        />
      </body>
    </html>
  );
}
