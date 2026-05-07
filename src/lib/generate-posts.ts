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
  bluesky_personal:
    "Bluesky personal (Tiána Lynn's personal account) — 1-3 sentences, written in first person as Tiána. Touches WVW themes lightly: Unicorn Wisdoms, Black experiences in neurodiversity, ADHD, rest, identity at work. Conversational, not corporate. Feels like a genuine thought, not a brand post. Under 280 characters. No hashtags.",
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

const BLACK_EXCELLENCE_CATEGORIES = [
  "Black Psychologist",
  "Black Psychology Study",
  "Black Quote",
  "Black Inspiration",
  "Black Neurodivergent Person",
] as const;

export type BlackExcellenceCategory = (typeof BLACK_EXCELLENCE_CATEGORIES)[number];

export interface BlackExcellencePosts {
  category: BlackExcellenceCategory;
  subject: string;
  twitter: string;
  threads: string;
  bluesky_personal: string;
  linkedin_wvw: string;
  facebook: string;
  bluesky_wvw: string;
}

export function getTodayBlackExcellenceCategory(): BlackExcellenceCategory {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - start) / 86400000);
  return BLACK_EXCELLENCE_CATEGORIES[dayOfYear % BLACK_EXCELLENCE_CATEGORIES.length];
}

export async function generateBlackExcellence(
  category: BlackExcellenceCategory
): Promise<BlackExcellencePosts> {
  const categoryGuides: Record<BlackExcellenceCategory, string> = {
    "Black Psychologist":
      "Spotlight a real, named Black psychologist (e.g. Kenneth Clark, Beverly Daniel Tatum, Thema Bryant, Na'im Akbar, Joy DeGruy, A. Wade Boykin, Umar Johnson, Riana Elyse Anderson). Mention their contribution to the field.",
    "Black Psychology Study":
      "Reference a real published psychological study, framework, or finding authored or co-authored by Black researchers, or focused specifically on Black mental health, identity, or neurodivergence. Cite the researcher and concept clearly.",
    "Black Quote":
      "Use a real, attributable quote from a Black leader, thinker, author, activist, or psychologist that speaks to identity, healing, resilience, systems, or psychology. Include the full name and context of who said it.",
    "Black Inspiration":
      "Spotlight a real Black person whose life or work is an example of resilience, systems change, mental health advocacy, neurodivergence, or breaking barriers — not just surviving but building.",
    "Black Neurodivergent Person":
      "Spotlight a real, named Black person who is publicly neurodivergent (ADHD, autism, dyslexia, etc.) — an artist, athlete, executive, activist, or thinker. Name the person, their neurodivergence, and their contribution.",
  };

  const prompt = `You are creating content for WVW's "Black Excellence" daily post series. Today's category: "${category}".

${categoryGuides[category]}

WVW context: Wholistic Vibes Wellness is a Black-led B2B organizational consulting practice focused on Black mental health in the workplace, psychological safety, neuroinclusion, and burnout. Founded by Tiána Lynn. Brand voice: calm, grounded, precise, luxury positioning. Core line: "Soft in appearance. Uncompromising in practice."

Generate posts for all 6 formats below. Return ONLY valid JSON — no markdown, no preamble.

Format rules:
- "subject": the person/study/quote subject (name or short title, e.g. "Dr. Beverly Daniel Tatum")
- "twitter": ≤240 characters. Sharp, declarative. Honors the subject. No hashtag spam. Ends clean.
- "threads": ≤480 characters. 2-3 sentences. Educational and honoring. No hashtags.
- "bluesky_personal": ≤270 characters. Written as Tiána (first person). Feels like a genuine personal reflection about why this person/study matters to her and her work. No hashtags.
- "linkedin_wvw": 120-150 words. WVW consulting lens. Connects this person/study to psychological safety, Black identity at work, or neuroinclusion. B2B authority voice. No fluff.
- "facebook": 80-120 words. Community-facing WVW page. Warm but precise. Invites reflection. May end with a soft question.
- "bluesky_wvw": ≤270 characters. WVW brand voice. Connects the subject to WVW's work. Quiet authority.

Return format:
{
  "subject": "...",
  "twitter": "...",
  "threads": "...",
  "bluesky_personal": "...",
  "linkedin_wvw": "...",
  "facebook": "...",
  "bluesky_wvw": "..."
}`;

  const msg = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1800,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Claude did not return valid JSON for Black Excellence");
  const parsed = JSON.parse(match[0]) as Omit<BlackExcellencePosts, "category">;
  return { category, ...parsed };
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
