import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the editorial voice for Wholistic Vibes Wellness (WVW), writing for Tiána Lynn's newsletter audience.

Newsletter series:
- "Ease, Power, Blackness" — personal, reflective, lived experience. First person. Warm but grounded. Named moments, not categories.
- "Black Excellence" — systemic analysis of Black professional experience. Structural lens. B2B adjacent but personal.
- "The Brief" — short-form WVW intelligence. Punchy. 3–5 insights. No fluff.

Brand voice: calm, grounded, structured, powerful, intentional, luxury.
Never: influencer energy, hollow affirmations, performative empathy, generic content, over-explaining.
Core line: "Soft in appearance. Uncompromising in practice."`;

const SERIES_INSTRUCTIONS: Record<string, string> = {
  "Ease, Power, Blackness": `Write a full "Ease, Power, Blackness" newsletter issue.
Structure:
SUBJECT: [compelling subject line — declarative or provocative question, no clickbait]
PREVIEW: [1 sentence, expands on subject]

---

[Opening paragraph: 2–3 sentences, personal entry point — a specific moment or observation]

[Body: 3–5 paragraphs — structural insight, lived truth, systems analysis]

[Close: 1 paragraph — grounded, not inspirational bypassing. May end with a soft invitation, not a hard CTA]

With care and precision,
Tiána`,

  "Black Excellence": `Write a full "Black Excellence" newsletter issue.
Structure:
SUBJECT: [sharp, structural — speaks to a professional truth]
PREVIEW: [sets the frame — 1 sentence]

---

[Opening: a workplace truth or recent pattern — specific, not generic]

[Body: systemic analysis — 3–4 tight paragraphs. Name the system, name the pattern, name what shifts]

WHAT TO DO WITH THIS:
1. [concrete takeaway for HR leaders or Black professionals]
2. [concrete takeaway]
3. [concrete takeaway]

[Close: 1 sentence, declarative]

In precision, WVW`,

  "The Brief": `Write a "The Brief" newsletter issue.
Structure:
SUBJECT: [direct, informational subject line]
PREVIEW: [1 sentence preview]

---

[Intro: 1 sentence frame]

1. **[Bold Header]** — [2–3 sentence insight]
2. **[Bold Header]** — [2–3 sentence insight]
3. **[Bold Header]** — [2–3 sentence insight]
4. **[Bold Header]** — [2–3 sentence insight]
5. **[Bold Header]** — [2–3 sentence insight]

UNICORN WISDOM: [one original WVW two-part saying]

WVW Intelligence`,
};

export async function POST(req: NextRequest) {
  const { series, theme, tone } = await req.json() as { series: string; theme: string; tone?: string };
  if (!series || !theme) return Response.json({ error: "series and theme required" }, { status: 400 });

  const instruction = SERIES_INSTRUCTIONS[series] ?? SERIES_INSTRUCTIONS["Ease, Power, Blackness"];

  const prompt = `Theme for this issue: "${theme}"${tone ? `\nTone note: ${tone}` : ""}

${instruction}

Write the full newsletter now. Start immediately with SUBJECT: — no preamble, no commentary.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await claude.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 2500,
          system: SYSTEM,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of anthropicStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Generation failed";
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
