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
          background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#fafafa",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative orbs */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -80,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            right: -100,
            width: 450,
            height: 450,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)",
          }}
        />

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
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, #a855f7, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 22,
            }}
          >
            UI
          </div>
          <span style={{ fontWeight: 600, fontSize: 28, color: "#d4d4d8" }}>
            UIScore
          </span>
        </div>

        {/* Heading */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: -2,
            display: "flex",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <span style={{ color: "#fafafa" }}>Score Your</span>
          <span
            style={{
              background: "linear-gradient(135deg, #a855f7, #6366f1, #06b6d4)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            UI
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 24,
            color: "#a1a1aa",
            margin: 0,
            marginBottom: 48,
          }}
        >
          AI-powered design feedback in seconds.
        </p>

        {/* Category pills */}
        <div style={{ display: "flex", gap: 12 }}>
          {["Typography", "Color", "Spacing", "Layout", "Polish"].map(
            (cat) => (
              <div
                key={cat}
                style={{
                  padding: "8px 20px",
                  borderRadius: 999,
                  border: "1px solid #27272a",
                  fontSize: 15,
                  color: "#71717a",
                  background: "rgba(24,24,27,0.6)",
                }}
              >
                {cat}
              </div>
            )
          )}
        </div>

        {/* URL bar at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 16,
            color: "#a855f7",
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
