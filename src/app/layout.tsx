import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { BRAND_NAME } from "@/lib/constants";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND_NAME} — Thoughtfully woven textiles`,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    "Considered fabrics, home textiles and small-batch pieces from Indian makers. Shop retail or apply for wholesale pricing.",
  openGraph: {
    type: "website",
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} — Thoughtfully woven textiles`,
    description:
      "Considered fabrics, home textiles and small-batch pieces from Indian makers.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#f4efe5",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>
        {children}
        <Toaster
          position="bottom-center"
          closeButton
          toastOptions={{
            style: {
              background: "#fbf8f2",
              color: "#1e1b17",
              border: "1px solid #d9cebd",
              borderRadius: "0.375rem",
              fontFamily: "var(--font-manrope)",
            },
          }}
        />
      </body>
    </html>
  );
}
