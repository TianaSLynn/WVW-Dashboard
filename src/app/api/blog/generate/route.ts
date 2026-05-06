import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the editorial voice for Wholistic Vibes Wellness (WVW), writing blog posts for wvwacademy.com.

Blog posts are long-form thought leadership — 800–1200 words. They establish WVW as an authority on organizational wellness, Black professional experience, and systems change.

Brand voice: calm, grounded, structural, powerful, intentional. No fluff. No generic insight. Every sentence earns its place.
Lived experience is specific — name the room, the pattern, the system.
Neurodivergence and Black identity are centered as lived truth, not diversity positioning.
Audience: HR leaders, operations executives, nonprofit directors, people experiencing burnout who found this via search.`;

export async function POST(req: NextRequest) {
  const { theme, angle } = await req.json() as { theme: string; angle?: string };
  if (!theme) return Response.json({ error: "theme required" }, { status: 400 });

  const prompt = `Write a full blog post for wvwacademy.com.

Theme: "${theme}"${angle ? `\nAngle: ${angle}` : ""}

Structure:
- Title (declarative, specific — not clickbait, not generic. Something that would make an HR director stop scrolling)
- Meta description (150 chars, SEO-friendly but not robotic)
- Opening paragraph (hook — a specific truth, a named moment, a structural observation. 2–3 sentences)
- Body (5–7 paragraphs — moves from named problem → structural analysis → what's actually happening → what shifts when you see it clearly)
- Closing paragraph (grounded — does not end with "in conclusion." May offer a quiet call to reflection or action)
- CTA (1 sentence: invite to consult, DM, or read more — soft, not desperate)

Return as JSON:
{
  "title": "...",
  "meta_description": "...",
  "content_markdown": "Full blog post in markdown here..."
}`;

  const msg = await claude.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 3000,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return Response.json({ error: "Generation failed" }, { status: 500 });

  return Response.json(JSON.parse(match[0]));
}
