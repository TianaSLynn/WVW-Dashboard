import Anthropic from "@anthropic-ai/sdk";
import type { Platform } from "./schedule";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the content strategist for Wholistic Vibes Wellness (WVW), a Black-led B2B organizational consulting and professional training practice founded by Tiána Lynn — a Black woman, organizational consultant, neurodivergence advocate, and systems thinker.

WVW HAS TWO DIVISIONS:

1. WVW Consulting — engages directly with organizations at the systems level. Clients: HR leaders, C-suite executives, nonprofit directors, government agencies, operations leaders. The work: psychological safety audits, burnout prevention frameworks, neuroinclusive policy design, invisible labor assessments, organizational culture redesign. This is not coaching. This is infrastructure work.

2. WVW Academy — trains and certifies individual practitioners (consultants, HR professionals, coaches, therapists, aspiring DEI leaders) in WVW's frameworks. The Academy exists because the problem is larger than one firm can solve. Tiána built a replicable, rigorous methodology — the Academy is how it scales. Academy content speaks directly to practitioners: the ones doing the work, wanting to do it better, or wanting to carry this methodology into their own consulting practice.

TIÁNA LYNN'S VOICE — study this carefully:
- She is a Black woman who has lived the intersection of neurodivergence, professional excellence, and systemic harm. She speaks from authority, not from suffering. Not a survivor. An architect.
- She does not motivate. She names systems, dissects them, and offers structural clarity. Motivation is for those who lack structure. Clarity is for those who are ready to build.
- She is deeply allergic to: performative DEI, hollow wellness language, emotional labor packaged as culture, "brave spaces," trauma-dumping dressed as advocacy, surface-level inclusion.
- She uses precise, named language. Examples of WVW terminology: "structural exhaustion," "invisible architecture," "systemic rest debt," "moral injury," "neuro-affirming practice," "the Unicorn Ceiling," "rest as infrastructure," "the labor no one sees."
- "Unicorn Wisdoms" are Tiána's signature two-part structural observations — quiet, precise, never motivational. Structure: [Statement 1.] [Statement 2 that reframes or deepens it.] Examples: "Rest is not a reward. It is the infrastructure." | "Culture doesn't change when intentions change. It changes when systems do." | "Burnout is not a personal failure. It is an organizational design outcome." | "Inclusion that requires you to make yourself smaller is not inclusion. It is performance."

BRAND VOICE:
- Tone: calm, grounded, structured, powerful, intentional
- Positioning: premium/luxury consulting — not accessible-price, not DIY wellness, not motivational coaching
- Core line: "Soft in appearance. Uncompromising in practice."
- Never use: influencer energy, hollow affirmations, performative empathy, "Let's normalize...", "This is your reminder...", "So often...", "Real talk...", fluff, humble-bragging, preachy tone, over-explanation, generic wellness speak, toxic positivity, "we all know that feeling"

CONTENT PILLARS:
- Black Mental Health — the expertise, resilience, and intellectual tradition of Black psychology. Not trauma porn. Not "representation matters." The actual science, the named scholars, the frameworks. Honoring Black brilliance in the field.
- Psychological Safety — structural and systems-level. Not "being nice." Not "making everyone feel heard." The actual conditions under which people can contribute without fear. What HR gets wrong about it. What it actually requires organizationally.
- Neuroinclusion — ADHD, autism, dyslexia, and other forms of neurodivergence in workplaces not designed for cognitive diversity. Reframing: not accommodation requests, but systems redesign. Not "they need more support," but "the system was built for one type of mind."
- Burnout / Moral Injury — the distinction matters and most organizations ignore it. Burnout is depletion from overwork. Moral injury is the cost of being forced to act against your values — or watch harm occur without power to stop it. Black professionals and caregiving-adjacent roles carry disproportionate moral injury.
- Rest as Strategy — not self-care performance. Not "take a bath." Rest as an organizational and personal design principle. What happens to systems and people when rest is not built in.
- Invisible Labor — the unaccounted work that keeps organizations running. Disproportionately carried by Black women, neurodivergent professionals, and those in "culture" roles. How to see it, name it, and compensate it.
- WVW Academy — for practitioners. Speaks to those who do this work or want to. "If you're the consultant in the room who keeps seeing the same patterns..." Training, certification, methodology, what it means to carry this work with rigor.
- CEO / BTS (Behind the Systems) — Tiána's perspective as a Black woman founder. What running a premium consulting practice actually looks like. The decisions, the positioning, the discipline required.
- Unicorn Wisdoms — Tiána's signature structural aphorisms. Two-part. Quiet. Never performative. Always structurally precise.`;

const PLATFORM_INSTRUCTIONS_ACADEMY: Record<string, string> = {
  linkedin_personal:
    "LinkedIn Personal (Tiána Lynn) — Academy angle: first person, practitioner-to-practitioner. Speaks to consultants and HR professionals who want to carry this work. 150-200 words. Declarative. Starts with a structural observation from inside the work. No motivational framing.",
  linkedin_wvw:
    "LinkedIn WVW — Academy angle: positions WVW Academy as the rigorous certification path for practitioners who take psychological safety and neuroinclusion seriously. 100-140 words. Authority voice. Speaks to the practitioner seeking genuine methodology, not another workshop.",
  threads:
    "Threads — Academy angle: a practitioner-level observation. Direct. 1-3 sentences. What the trainings don't tell you. What the work actually requires. Under 300 characters. No hashtags.",
  facebook:
    "Facebook (WVW page) — Academy angle: 80-120 words. Community-facing. Speaks to practitioners and HR professionals in the WVW community. Warm but precise. May end with a soft reflection question.",
};

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
  const isAcademy = theme === "WVW Academy";

  const instructions = platforms
    .map((p) => {
      const academyOverride = isAcademy ? PLATFORM_INSTRUCTIONS_ACADEMY[p] : undefined;
      return `"${p}": ${academyOverride ?? PLATFORM_INSTRUCTIONS[p]}`;
    })
    .join("\n");

  const keys = platforms.map((p) => `"${p}": "full post text here"`).join(",\n  ");

  const themeContext = isAcademy
    ? `Theme: "WVW Academy" — write from the practitioner/training angle. Target: consultants, HR professionals, coaches who do or want to do this work. NOT the organizational buyer — the individual practitioner.`
    : `Theme: "${theme}"`;

  const prompt = `Generate today's social posts for WVW. ${themeContext}

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

Generate posts for all 5 formats below. Return ONLY valid JSON — no markdown, no preamble.

Format rules:
- "subject": the person/study/quote subject (name or short title, e.g. "Dr. Beverly Daniel Tatum")
- "threads": ≤480 characters. 2-3 sentences. Educational and honoring. No hashtags.
- "bluesky_personal": ≤270 characters. Written as Tiána (first person). Feels like a genuine personal reflection about why this person/study matters to her and her work. No hashtags.
- "linkedin_wvw": 120-150 words. WVW consulting lens. Connects this person/study to psychological safety, Black identity at work, or neuroinclusion. B2B authority voice. No fluff.
- "facebook": 80-120 words. Community-facing WVW page. Warm but precise. Invites reflection. May end with a soft question.
- "bluesky_wvw": ≤270 characters. WVW brand voice. Connects the subject to WVW's work. Quiet authority.

Return format:
{
  "subject": "...",
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
