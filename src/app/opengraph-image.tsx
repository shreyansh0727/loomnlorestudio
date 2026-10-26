import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/lib/data/content";

export const alt =
  "Handmade scrunchies, bows, ties and crochet accessories, crafted in Varanasi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const settings = await getSiteSettings();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#fdf6f3",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -190,
            right: -150,
            width: 540,
            height: 540,
            borderRadius: 270,
            background: "#f6dfe4",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -170,
            left: -110,
            width: 400,
            height: 400,
            borderRadius: 200,
            background: "#f3e7c8",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 48,
            right: 48,
            bottom: 48,
            left: 48,
            border: "2px solid rgba(200, 101, 127, 0.35)",
            borderRadius: 24,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "96px 104px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: 8,
                textTransform: "uppercase",
                color: "#c8657f",
              }}
            >
              Handmade in Varanasi
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 28,
                fontSize: 112,
                fontWeight: 500,
                lineHeight: 1,
                letterSpacing: -2,
                color: "#3f2a2c",
              }}
            >
              {settings.brandName}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 24,
                fontSize: 34,
                color: "#6b5455",
              }}
            >
              {settings.brandTagline}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#8a6b6c",
            }}
          >
            <div style={{ display: "flex" }}>
              Scrunchies · Bows · Ties · Crochet
            </div>
            <div style={{ display: "flex", color: "#c8657f" }}>
              Retail &amp; Wholesale
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
