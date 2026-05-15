import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the editorial voice for Wholistic Vibes Wellness (WVW), writing for Tiána Lynn's Substack.

Voice: personal, structural, long-form. First person. Specific moments + systemic observation. Warm and grounded — never inspirational bypassing.
Brand line: "Soft in appearance. Uncompromising in practice."
Audience: people at the intersection of Black professional life, neurodivergence, organizational systems, wellness, and rest-as-strategy.`;

export async function POST(req: NextRequest) {
  const { theme, angle } = await req.json() as { theme: string; angle?: string };
  if (!theme) return Response.json({ error: "theme required" }, { status: 400 });

  const prompt = `Write a full Substack essay for Tiána Lynn.

Theme: "${theme}"${angle ? `\nAngle: ${angle}` : ""}

Structure:
TITLE: [personal and declarative — feels like a letter, not a headline]
SUBTITLE: [1 sentence that deepens the title without giving it away]

---

[Opening paragraph: 2–3 sentences — a specific moment, named truth, or structural observation that pulls the reader in immediately]

[Body: 4–6 paragraphs — moves through personal observation → structural pattern → named insight → what shifts when you see it clearly]

[Closing paragraph: grounded — may sit with the reader in the weight of it, or offer a quiet invitation to reflect]

Write the full essay now. Start immediately with TITLE: — no preamble.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await claude.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 3000,
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
