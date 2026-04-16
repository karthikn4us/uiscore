import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "UIScore - AI-powered design feedback in seconds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#0d0d0d",
          position: "relative",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#171717",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 20,
              color: "#ffffff",
            }}
          >
            UI
          </div>
          <span style={{ fontWeight: 600, fontSize: 26, color: "#171717" }}>
            UIScore
          </span>
        </div>

        {/* Heading */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: -2,
            color: "#0d0d0d",
            marginBottom: 16,
          }}
        >
          Score your UI.
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 24,
            color: "#a3a3a3",
            margin: 0,
            marginBottom: 48,
          }}
        >
          AI-powered design feedback in seconds.
        </p>

        {/* Category pills */}
        <div style={{ display: "flex", gap: 10 }}>
          {["Typography", "Color", "Spacing", "Layout", "Polish"].map(
            (cat) => (
              <div
                key={cat}
                style={{
                  padding: "8px 20px",
                  borderRadius: 999,
                  border: "1px solid #e5e5e5",
                  fontSize: 15,
                  color: "#737373",
                  background: "#fafafa",
                }}
              >
                {cat}
              </div>
            )
          )}
        </div>

        {/* URL at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 15,
            color: "#171717",
            fontWeight: 600,
          }}
        >
          uiscore.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
