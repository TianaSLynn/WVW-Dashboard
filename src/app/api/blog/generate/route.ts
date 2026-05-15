import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export const maxDuration = 60;

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the editorial voice for Wholistic Vibes Wellness (WVW), writing blog posts for wvwacademy.com.

Blog posts are long-form thought leadership — 800–1200 words. They establish WVW as an authority on organizational wellness, Black professional experience, and systems change.

Brand voice: calm, grounded, structural, powerful, intentional. No fluff. No generic insight. Every sentence earns its place.
Lived experience is specific — name the room, the pattern, the system.
Neurodivergence and Black identity are centered as lived truth, not diversity positioning.
Audience: HR leaders, operations executives, nonprofit directors, people experiencing burnout who found this via search.`;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  const { theme, angle } = await req.json() as { theme: string; angle?: string };
  if (!theme) return Response.json({ error: "theme required" }, { status: 400 });

  const prompt = `Write a full blog post for wvwacademy.com.

Theme: "${theme}"${angle ? `\nAngle: ${angle}` : ""}

Structure:
TITLE: [declarative, specific — not clickbait, not generic]
META: [150 chars, SEO-friendly meta description]

---

[Opening paragraph: hook — specific truth, named moment, structural observation. 2–3 sentences]

[Body: 5–7 paragraphs — named problem → structural analysis → what's actually happening → what shifts when you see it clearly]

[Closing paragraph: grounded — does not end with "in conclusion"]

CTA: [1 sentence: invite to consult, DM, or read more — soft, not desperate]

Write the full blog post now. Start immediately with TITLE: — no preamble.`;

  const encoder = new TextEncoder();
  let fullText = "";

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
            fullText += chunk.delta.text;
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }

        // Save to Supabase in background after streaming completes
        const titleMatch = fullText.match(/^TITLE:\s*(.+)/m);
        const metaMatch  = fullText.match(/^META:\s*(.+)/m);
        const title = titleMatch?.[1]?.trim() ?? theme;
        const meta  = metaMatch?.[1]?.trim() ?? "";
        const slug  = `${slugify(title)}-${Date.now().toString(36)}`;

        void supabase.from("blog_posts").insert({
          title, slug, meta_description: meta, content_markdown: fullText, theme, source: "dashboard",
        });
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
