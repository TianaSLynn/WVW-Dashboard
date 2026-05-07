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

Return ONLY valid JSON — no markdown fences, no preamble, no explanation. Start directly with {

{
  "month": "${monthLabel}",
  "focus": "One overarching monthly theme sentence",
  "weeks": [
    {
      "week": 1,
      "dates": "May 1–7",
      "theme": "Weekly theme name",
      "pillar": "Content pillar",
      "intent": "Strategic intent sentence",
      "posts": [
        { "day": "Monday", "platform": "LinkedIn Personal", "format": "Essay hook", "angle": "Specific angle" },
        { "day": "Tuesday", "platform": "Instagram", "format": "Carousel", "angle": "Specific angle" },
        { "day": "Wednesday", "platform": "LinkedIn WVW", "format": "Short post", "angle": "Specific angle" },
        { "day": "Wednesday", "platform": "Threads", "format": "Thread", "angle": "Specific angle" },
        { "day": "Thursday", "platform": "Twitter", "format": "Short post", "angle": "Specific angle" },
        { "day": "Friday", "platform": "Facebook", "format": "Post", "angle": "Specific angle" },
        { "day": "Friday", "platform": "Bluesky", "format": "Short post", "angle": "Specific angle" }
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

Produce 4 complete weeks. Each week must have 6–8 posts across LinkedIn Personal, LinkedIn WVW, Instagram, Threads, Twitter, Facebook, Bluesky. Make angles specific and WVW-branded — never generic.`;

  const msg = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return Response.json({ error: "Generation failed" }, { status: 500 });

  try {
    const plan = JSON.parse(match[0]);
    return Response.json(plan);
  } catch {
    return Response.json({ error: "JSON parse failed", raw: raw.slice(0, 500) }, { status: 500 });
  }
}
