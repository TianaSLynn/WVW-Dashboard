import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the voice architect for Wholistic Vibes Wellness (WVW), writing in Tiána Lynn's signature style.

Unicorn Wisdoms are original, signature sayings — not affirmations, not motivational quotes, not generic empowerment language.

They are:
- Specific and earned, not broad and inspirational
- Structurally observant — they name a system or truth, not a feeling
- Calm and direct — authority without performance
- Often a two-part construction: the appearance / the reality
- Rooted in: softness, standards, Black brilliance, truth-telling, rest, protection, healing, systems, leadership

Examples of the voice:
- "Softness is the look. Standards are the requirement."
- "Rest is not proof that you have given up. It is proof that you intend to continue."
- "Some systems call your pain a weakness because they benefit from your silence."
- "You are not difficult to support. The system may simply be badly designed."

Never: hollow affirmations, "you've got this," trending language, performative empathy, generic positivity.`;

export async function POST(req: NextRequest) {
  const { mode, saying, category } = await req.json();

  let prompt = "";

  if (mode === "generate") {
    const cat = category ?? "softness, standards, truth-telling";
    prompt = `Write 10 original Unicorn Wisdoms focused on: ${cat}

Format: numbered list, one saying per line. No explanations, no categories, just the sayings.
Each one: 1–2 sentences max. Specific. Structural. Earned.`;
  } else if (mode === "expand" && saying) {
    prompt = `Take this Unicorn Wisdom and expand it into 7 distinct social posts:

Wisdom: "${saying}"

For each post, specify platform and write the full post copy. Platforms: LinkedIn Personal, LinkedIn WVW, Instagram caption, Instagram carousel cover, TikTok hook, Threads post, Newsletter subject line.

No preamble. Format as a numbered list with platform label on each.`;
  } else if (mode === "match") {
    prompt = `Match existing WVW Unicorn Wisdom categories to specific audience pain points.

Audience pain points:
- Chronic turnover in high-capability employees
- DEI initiatives not producing change
- Culture survey scores declining
- Leadership friction
- Unexplained burnout in top performers
- Culture programs not sticking

Wisdom categories: softness, standards, Black brilliance, truth-telling, rest, protection, healing, systems, leadership

For each pain point, suggest which wisdom category fits and write one example wisdom that would resonate with an HR leader or operations executive experiencing it.`;
  } else if (mode === "series") {
    prompt = `Design a 30-day Unicorn Wisdom content series for WVW.

Output: a calendar grid — Week 1–4, with a theme for each week and 5 wisdom prompts per week (Mon–Fri).

Each prompt: the wisdom topic area + one example saying.
Week themes should build on each other: establish → deepen → challenge → resolve.

Format cleanly. No filler.`;
  } else {
    return Response.json({ error: "valid mode required: generate | expand | match | series" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 1200,
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
