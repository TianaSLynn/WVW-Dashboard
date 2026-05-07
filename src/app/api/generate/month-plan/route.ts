import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the content strategist for Wholistic Vibes Wellness (WVW), a B2B organizational consulting practice founded by Tiána Lynn.
Brand voice: calm, grounded, structured, powerful, intentional, luxury positioning.
Core themes: burnout/moral exhaustion, invisible labor, neurodivergence at work, Black identity in professional spaces, organizational systems design, rest as strategy, psychological safety.
Primary audience: HR leaders, operations executives, nonprofit directors, government agencies.`;

export async function POST(req: NextRequest) {
  const { month } = await req.json() as { month?: string };
  const monthLabel = month ?? new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  const prompt = `Build a full content month plan for WVW for ${monthLabel}.

Return ONLY valid JSON — no markdown, no preamble.

Structure:
{
  "month": "${monthLabel}",
  "focus": "One overarching monthly theme sentence",
  "weeks": [
    {
      "week": 1,
      "dates": "May 1–7",
      "theme": "Weekly theme name",
      "pillar": "Which content pillar this maps to",
      "intent": "One sentence on the strategic intent of this week",
      "posts": [
        {
          "day": "Monday",
          "platform": "LinkedIn Personal",
          "format": "Essay hook / Carousel / Short post / Thread / Story",
          "angle": "Specific content angle for this post"
        }
      ]
    }
  ],
  "newsletterPlan": [
    { "date": "May 5 (Mon)", "series": "Ease, Power, Blackness", "theme": "..." },
    { "date": "May 7 (Wed)", "series": "Black Excellence", "theme": "..." },
    { "date": "May 9 (Fri)", "series": "The Brief", "theme": "..." }
  ],
  "repurposeMap": [
    { "source": "Week 1 LinkedIn essay", "repurpose": ["IG carousel", "Threads thread", "Substack section"] }
  ]
}

Cover 4 weeks. Each week should have 5–7 posts across platforms (LinkedIn Personal, LinkedIn WVW, Instagram, Threads, Twitter, Facebook, Bluesky). Vary formats. Make angles specific and actionable — not generic.`;

  const stream = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let buffer = "";
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          buffer += event.delta.text;
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
