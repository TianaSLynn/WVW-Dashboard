import Anthropic from "@anthropic-ai/sdk";
import type { Platform } from "./schedule";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the content strategist for Wholistic Vibes Wellness (WVW), a B2B organizational consulting practice founded by Tiána Lynn.

Brand voice: calm, grounded, structured, powerful, intentional, luxury positioning.
Never: influencer energy, hollow affirmations, performative empathy, fluff, generic content, over-explaining.
Core line: "Soft in appearance. Uncompromising in practice."
Primary audience: HR leaders, operations executives, nonprofit directors, government agencies.
Core themes: burnout/moral exhaustion, invisible labor, neurodivergence at work, Black identity in professional spaces, organizational systems design, rest as strategy, psychological safety.`;

const PLATFORM_INSTRUCTIONS: Record<Platform, string> = {
  linkedin_personal:
    "LinkedIn Personal (Tiána Lynn) — first person, declarative, 150-200 words. No question openers. No 'I'm excited to share.' Start with a structural truth. End with a grounded close.",
  linkedin_wvw:
    "LinkedIn WVW — B2B authority voice, 120-160 words. Speaks directly to HR leaders and operations executives. Consulting lens. Precise. No warmth-and-fuzziness.",
  instagram:
    "Instagram carousel — 4 slides for a branded quote carousel. Separate each slide with ||| (three pipes, nothing else on that delimiter line). Slide 1: hook or structural truth (1-2 sentences, bold and clear). Slide 2: reframe or 'here's why.' Slide 3: the shift — what changes when you see it differently. Slide 4: closing line ending with 'Save this.' or 'Share with your team.' Then on a new line write: HASHTAGS: [2-4 relevant hashtags]. Each slide must be under 160 characters. No hashtags within slides.",
  threads:
    "Threads — 1-3 punchy sentences. Direct structural observation. No hashtags. No fluff. Under 300 characters.",
  tiktok:
    "TikTok script — written as spoken word. Hook statement (1 line) + 3 key points + close. Max 60 seconds when read aloud. No 'hey guys.' No performance.",
  twitter:
    "X/Twitter — sharp, declarative. Under 240 characters. One structural truth or named observation. No hashtag spam. Standalone — does not require context.",
  bluesky:
    "Bluesky — 1-2 sentences. Structural truth or grounded observation. Under 260 characters. No hashtags. Feels like a quiet, precise thought.",
  facebook:
    "Facebook (WVW page) — 100-150 words. Community-facing. Invites reflection without being preachy. May end with a soft question. Professional but approachable.",
};

export type GeneratedPosts = Partial<Record<Platform, string>>;

export async function generateDailyPosts(
  theme: string,
  platforms: Platform[]
): Promise<GeneratedPosts> {
  const instructions = platforms
    .map((p) => `"${p}": ${PLATFORM_INSTRUCTIONS[p]}`)
    .join("\n");

  const keys = platforms.map((p) => `"${p}": "full post text here"`).join(",\n  ");

  const prompt = `Generate today's social posts for WVW. Theme: "${theme}"

Write one post per platform below. Return ONLY valid JSON — no markdown, no preamble, no explanation.

Platforms:
${instructions}

Return format:
{
  ${keys}
}`;

  const msg = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 2500,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Claude did not return valid JSON");
  return JSON.parse(match[0]) as GeneratedPosts;
}

export async function generateWisdoms(count = 5): Promise<string[]> {
  const msg = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 600,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Write ${count} original Unicorn Wisdoms for WVW. They should be calm, structurally observant, specific — never hollow affirmations. Two-part constructions work well ("X is Y. Z is the requirement."). Return ONLY a JSON array, no markdown:\n["wisdom 1", "wisdom 2", ...]`,
      },
    ],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "[]";
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Claude did not return valid JSON array");
  return JSON.parse(match[0]) as string[];
}
