import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text") ?? "Soft in appearance. Uncompromising in practice.";
  const theme = searchParams.get("theme") ?? "";

  // Pull out a punchy excerpt — first sentence or first 160 chars
  const firstSentence = text.split(/(?<=[.!?])\s/)[0] ?? text;
  const excerpt = firstSentence.length > 160 ? firstSentence.slice(0, 157) + "…" : firstSentence;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#1C3A2A",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "90px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Top label */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <span
            style={{
              color: "#B8A06A",
              fontSize: 22,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 400,
            }}
          >
            Wholistic Vibes Wellness
          </span>
          {theme ? (
            <span
              style={{
                color: "#4A5E4F",
                fontSize: 18,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {theme}
            </span>
          ) : null}
        </div>

        {/* Main text */}
        <div
          style={{
            color: "#F5F0E8",
            fontSize: excerpt.length > 100 ? 44 : 56,
            fontWeight: 600,
            lineHeight: 1.35,
            maxWidth: "860px",
          }}
        >
          {excerpt}
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            color: "#C4A09A",
            fontSize: 20,
            fontStyle: "italic",
          }}
        >
          Soft in appearance. Uncompromising in practice.
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
    }
  );
}
