import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const maxDuration = 60;

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the editorial voice for Wholistic Vibes Wellness (WVW), writing for Tiána Lynn's newsletter audience.

Newsletter series:
- "Ease, Power, Blackness" — personal, reflective, lived experience. First person. Warm but grounded. Named moments, not categories.
- "Black Excellence" — systemic analysis of Black professional experience. Structural lens. B2B adjacent but personal.
- "The Brief" — short-form WVW intelligence. Punchy. 3–5 insights. No fluff.

Brand voice: calm, grounded, structured, powerful, intentional, luxury.
Never: influencer energy, hollow affirmations, performative empathy, generic content, over-explaining.
Core line: "Soft in appearance. Uncompromising in practice."`;

export async function POST(req: NextRequest) {
  const { series, theme, tone } = await req.json() as {
    series: string;
    theme: string;
    tone?: string;
  };

  if (!series || !theme) {
    return Response.json({ error: "series and theme required" }, { status: 400 });
  }

  const seriesInstructions: Record<string, string> = {
    "Ease, Power, Blackness": `Write a full "Ease, Power, Blackness" newsletter issue.
Structure:
- Subject line (compelling, no clickbait — declarative or provocative question)
- Preview text (1 sentence, expands on subject)
- Opening paragraph (2–3 sentences, personal entry point — a specific moment or observation)
- Body (3–5 paragraphs — structural insight, lived truth, systems analysis)
- Close (1 paragraph — grounded, not inspirational bypassing. May end with a soft invitation, not a hard CTA)
- Sign-off: "With care and precision, Tiána"`,

    "Black Excellence": `Write a full "Black Excellence" newsletter issue.
Structure:
- Subject line (sharp, structural — speaks to a professional truth)
- Preview text (sets the frame — 1 sentence)
- Opening (a workplace truth or recent pattern — specific, not generic)
- Body (systemic analysis — 3–4 tight paragraphs. Name the system, name the pattern, name what shifts)
- What to do with this (2–3 concrete takeaways for HR leaders or Black professionals)
- Close (1 sentence, declarative)
- Sign-off: "In precision, WVW"`,

    "The Brief": `Write a "The Brief" newsletter issue.
Structure:
- Subject line (direct, informational)
- Preview text
- Intro (1 sentence frame)
- 4–5 numbered insights, each: bold header + 2–3 sentence explanation
- One Unicorn Wisdom to close
- Sign-off: "WVW Intelligence"`,
  };

  const instruction = seriesInstructions[series] ?? seriesInstructions["Ease, Power, Blackness"];

  const prompt = `Theme for this issue: "${theme}"${tone ? `\nTone note: ${tone}` : ""}

${instruction}

Return as JSON:
{
  "subject": "subject line here",
  "preview_text": "preview text here",
  "content_html": "<p>Full HTML newsletter content here...</p>"
}`;

  // Stream to Beehiiv after generation
  const msg = await claude.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 2500,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return Response.json({ error: "Generation failed" }, { status: 500 });

  const generated = JSON.parse(match[0]) as {
    subject: string;
    preview_text: string;
    content_html: string;
  };

  // Push to Beehiiv as draft
  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;

  if (!apiKey || !pubId) {
    return Response.json({ generated, beehiiv: null, note: "BEEHIIV_API_KEY or BEEHIIV_PUBLICATION_ID not configured" });
  }

  const beehiivRes = await fetch(`https://api.beehiiv.com/v2/publications/${pubId}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject_line: generated.subject,
      preview_text: generated.preview_text,
      content_html: generated.content_html,
      status: "draft",
      audience: "free",
    }),
  });

  const beehiivData = beehiivRes.ok
    ? await beehiivRes.json()
    : { error: await beehiivRes.text() };

  return Response.json({ generated, beehiiv: beehiivData });
}
