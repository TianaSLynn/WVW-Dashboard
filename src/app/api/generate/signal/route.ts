import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the content strategist for Wholistic Vibes Wellness (WVW), a Black-led B2B organizational consulting practice founded by Tiána Lynn.

Brand voice: calm, grounded, structured, powerful, intentional, luxury positioning.
Never: influencer energy, hollow affirmations, performative empathy, fluff, generic content, over-explaining.
Core line: "Soft in appearance. Uncompromising in practice."
Primary audience: HR leaders, operations executives, nonprofit directors, Black professionals, neurodivergent practitioners.
Core themes: burnout/moral injury, invisible labor, neurodivergence at work, Black identity in professional spaces, organizational systems design, rest as strategy, psychological safety.

Tiána's voice: speaks from authority, not from suffering. Names systems, dissects them, offers structural clarity. Never motivational.`;

export async function POST(req: NextRequest) {
  const { theme, action } = await req.json() as { theme: string; action: string };
  if (!theme) return Response.json({ error: "theme required" }, { status: 400 });

  // Parse what formats to generate from the action string
  const actionLower = action?.toLowerCase() ?? "";
  const needsCarousel   = actionLower.includes("carousel");
  const needsEssay      = actionLower.includes("essay") || actionLower.includes("thought piece") || actionLower.includes("blog");
  const needsNewsletter = actionLower.includes("newsletter");
  const needsLinkedIn   = actionLower.includes("linkedin") || actionLower.includes("post");
  const needsReel       = actionLower.includes("reel") || actionLower.includes("video") || actionLower.includes("tiktok");
  const needsWisdom     = actionLower.includes("wisdom");
  const needsThreads    = actionLower.includes("thread") || actionLower.includes("bluesky");
  const needsPodcast    = actionLower.includes("podcast") || actionLower.includes("segment");

  const sections: string[] = [];

  if (needsEssay || needsNewsletter) {
    sections.push(`## ESSAY / NEWSLETTER ANGLE
One specific, structural angle for this theme (2–3 sentences). Name a pattern, name a system, name what shifts when you see it clearly. NOT generic.`);
  }

  if (needsLinkedIn) {
    sections.push(`## LINKEDIN POST (Tiána Lynn — Personal)
First-person, declarative. 150–200 words. Start with a structural truth, not a question. No "I'm excited to share." End grounded.

## LINKEDIN POST (WVW — B2B)
Authority voice. 120–160 words. Speaks directly to HR leaders or operations executives. Consulting lens. Precise.`);
  } else {
    sections.push(`## LINKEDIN POST (Tiána Lynn — Personal)
First-person, declarative. 150–200 words. Start with a structural truth. End grounded.`);
  }

  if (needsCarousel) {
    sections.push(`## CAROUSEL OUTLINE (Instagram / LinkedIn)
Cover slide title + 5 interior slide headers + CTA slide. Each header: 1 line, bold, declarative. Structural, not inspirational.`);
  }

  if (needsReel) {
    sections.push(`## REEL / TIKTOK SCRIPT
Hook (1 line) → 3 structural points → close. Written as spoken. No "hey guys." No performance. Under 60 seconds when read aloud.`);
  }

  if (needsThreads) {
    sections.push(`## THREADS / BLUESKY POST
1–3 sentences. Direct structural observation. Under 300 characters. No hashtags. No fluff.`);
  }

  if (needsWisdom) {
    sections.push(`## UNICORN WISDOM
One WVW signature two-part saying. Quiet. Precise. Structurally observant. Never hollow.
Format: [Statement 1.] [Statement 2 that reframes or deepens it.]`);
  }

  if (needsPodcast) {
    sections.push(`## PODCAST SEGMENT
2–3 sentences: a story entry point, not a topic summary. What moment does this episode open on?`);
  }

  // Always include Threads if nothing specific matched, so there's always output
  if (sections.length <= 1) {
    sections.push(`## CAROUSEL OUTLINE
Cover slide title + 5 interior slide headers + CTA slide. Declarative, structural.

## THREADS POST
1–3 sentences. Direct. Under 300 characters.

## UNICORN WISDOM
Two-part. Quiet. Precise.`);
  }

  const prompt = `Generate content for WVW based on this live Reddit signal.

Signal theme: "${theme}"
Recommended content format: ${action || "social post + carousel"}

Generate ONLY the formats listed below — no filler, no preamble, no commentary. Each section starts with the ## header.

${sections.join("\n\n")}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 1800,
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
