import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/data/content";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();

  return {
    name: `${settings.brandName} — Handmade hair accessories`,
    short_name: settings.brandName,
    description:
      "Handmade scrunchies, hair bows, fashion ties, headbands and crochet accessories, crafted in Varanasi. Retail and wholesale.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdf6f3",
    theme_color: "#fdf6f3",
    lang: "en-IN",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
