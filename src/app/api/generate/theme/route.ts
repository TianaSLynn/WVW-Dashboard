import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the content strategist for Wholistic Vibes Wellness (WVW), a B2B organizational consulting practice founded by Tiána Lynn.

Brand voice: calm, grounded, structured, powerful, intentional, luxury positioning.
Never: influencer energy, hollow affirmations, performative empathy, fluff, generic content, over-explaining.
Tone always: lived experience is specific, neurodivergence named directly, systems named as systems, B2B authority.

Core line: "Soft in appearance. Uncompromising in practice."
Primary audience: HR leaders, operations executives, nonprofit directors, government agencies.
Core themes: burnout/moral exhaustion, invisible labor, neurodivergence at work, Black identity in professional spaces, organizational systems design, rest as strategy, psychological safety.`;

export async function POST(req: NextRequest) {
  const { theme } = await req.json();
  if (!theme) return Response.json({ error: "theme required" }, { status: 400 });

  const prompt = `Generate a complete content theme pack for: "${theme}"

Return exactly this structure — no preamble, no filler:

## ESSAY PROMPT
One specific essay angle (2–3 sentences). State a structural truth, not a generic observation.

## LINKEDIN POST (Personal — Tiána Lynn)
A first-person, declarative post. 150–200 words. No question openers. No "I'm excited to share."

## LINKEDIN POST (WVW)
A B2B authority post. 120–160 words. Consulting lens. Speaks to HR/operations leaders.

## CAROUSEL OUTLINE (Instagram)
Cover slide title + 5 interior slide headers + CTA slide. Each header: 1 line, bold declarative.

## REEL HOOK
3 lines: hook statement → pause beat → expand. No "hey guys." No trending sounds.

## UNICORN WISDOM
One original WVW signature saying. Concise. Specific. No hollow affirmations.

## PODCAST SEGMENT NOTE
A 2–3 sentence segment prompt. Frame it as a story entry point, not a topic summary.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 1500,
          system: SYSTEM,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
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
