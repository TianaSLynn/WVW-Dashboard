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
- Title (declarative, specific — not clickbait, not generic)
- Meta description (150 chars, SEO-friendly)
- Opening paragraph (hook — specific truth, named moment, structural observation. 2–3 sentences)
- Body (5–7 paragraphs — named problem → structural analysis → what's actually happening → what shifts when you see it clearly)
- Closing paragraph (grounded — does not end with "in conclusion")
- CTA (1 sentence: invite to consult, DM, or read more — soft, not desperate)

Return ONLY valid JSON starting with {:
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

  const post = JSON.parse(match[0]) as { title: string; meta_description: string; content_markdown: string };

  // Auto-save to Supabase
  const slug = `${slugify(post.title)}-${Date.now().toString(36)}`;
  const { data: saved } = await supabase
    .from("blog_posts")
    .insert({ title: post.title, slug, meta_description: post.meta_description, content_markdown: post.content_markdown, theme, source: "dashboard" })
    .select("slug")
    .single();

  return Response.json({ ...post, slug: saved?.slug ?? slug, blogUrl: `/blog/${saved?.slug ?? slug}` });
}
