import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "./supabase";
import type { Platform } from "./schedule";
import { fetchTopSignal } from "./signals";
import { BRAND_VOICE } from "./brand-voice";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `${BRAND_VOICE}

WVW HAS TWO DIVISIONS:

1. WVW Consulting — engages directly with organizations at the systems level. Clients: HR leaders, C-suite executives, nonprofit directors, government agencies, operations leaders, CHW program managers. The work: psychological safety audits, burnout prevention frameworks, neuroinclusive policy design, invisible labor assessments, CHW structural care audits, organizational culture redesign. This is not coaching. This is infrastructure work.

2. WVW Academy (WVWA) — trains and certifies individual practitioners (consultants, HR professionals, coaches, therapists, CHW supervisors, aspiring DEI leaders) in WVW's frameworks. The Academy exists because the problem is larger than one firm can solve. Tiána built a replicable, rigorous methodology — the Academy is how it scales. Academy content speaks directly to practitioners: the ones doing the work, wanting to do it better, or wanting to carry this methodology into their own practice.

TIÁNA LYNN'S VOICE — study this carefully:
- She is a Black woman who has lived the intersection of neurodivergence, professional excellence, and systemic harm. She speaks from authority, not from suffering. Not a survivor. An architect.
- She does not motivate. She names systems, dissects them, and offers structural clarity. Motivation is for those who lack structure. Clarity is for those who are ready to build.
- She is deeply allergic to: performative DEI, hollow wellness language, emotional labor packaged as culture, "brave spaces," trauma-dumping dressed as advocacy, surface-level inclusion.
- She uses precise, named language. Examples of WVW terminology: "structural exhaustion," "invisible architecture," "systemic rest debt," "moral injury," "neuro-affirming practice," "the Unicorn Ceiling," "rest as infrastructure," "the labor no one sees," "structural care," "wellness optics."
- "Unicorn Wisdoms" are Tiána's signature two-part structural observations — quiet, precise, never motivational. Structure: [Statement 1.] [Statement 2 that reframes or deepens it.] Examples: "Rest is not a reward. It is the infrastructure." | "Culture doesn't change when intentions change. It changes when systems do." | "Burnout is not a personal failure. It is an organizational design outcome." | "Inclusion that requires you to make yourself smaller is not inclusion. It is performance."

CONTENT PILLARS:
- Black Mental Health — the expertise, resilience, and intellectual tradition of Black psychology. Not trauma porn. Not "representation matters." The actual science, the named scholars, the frameworks. Honoring Black brilliance in the field.
- Psychological Safety — structural and systems-level. Not "being nice." Not "making everyone feel heard." The actual conditions under which people can contribute without fear. What HR gets wrong about it. What it actually requires organizationally.
- Neuroinclusion — ADHD, autism, dyslexia, and other forms of neurodivergence in workplaces not designed for cognitive diversity. Reframing: not accommodation requests, but systems redesign. Not "they need more support," but "the system was built for one type of mind."
- Burnout / Moral Injury — the distinction matters and most organizations ignore it. Burnout is depletion from overwork. Moral injury is the cost of being forced to act against your values — or watch harm occur without power to stop it. Black professionals and caregiving-adjacent roles carry disproportionate moral injury.
- CHW Structural Care — Community Health Workers deserve caseload limits, safety, pay, supervision, and decompression built into the job design, not left to individual resilience.
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
  bluesky_personal:
    "Bluesky personal (Tiána Lynn's personal account) — Academy angle: 1-3 sentences, written in first person as Tiána. Reflects on why she built the Academy — what she kept seeing practitioners get wrong, or what WVW's methodology offers that generic trainings don't. Conversational, not corporate. Under 280 characters. No hashtags.",
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

async function fetchRecentExcerpts(
  platforms: string[],
  limit = 40
): Promise<Record<string, string[]>> {
  const { data } = await supabase
    .from("post_log")
    .select("platform, excerpt, theme")
    .in("platform", platforms)
    .eq("status", "posted")
    .order("created_at", { ascending: false })
    .limit(limit * platforms.length);

  const result: Record<string, string[]> = {};
  for (const row of data ?? []) {
    const p = row.platform as string;
    if (!result[p]) result[p] = [];
    if (result[p].length < limit) result[p].push(row.excerpt as string);
  }
  return result;
}

function buildNoRepeatBlock(excerpts: Record<string, string[]>): string {
  const entries = Object.entries(excerpts).filter(([, list]) => list.length > 0);
  if (entries.length === 0) return "";
  const lines = entries
    .map(([p, list]) => `${p}:\n${list.map((e) => `  - "${e}"`).join("\n")}`)
    .join("\n\n");
  return `\nCRITICAL — NO REPEATS: The following are opening lines from posts already published on each platform. You MUST NOT repeat, rephrase, echo, or use a similar angle, framing, hook, or structural construction to any of them. Each post must open and develop in a completely different direction:\n\n${lines}\n`;
}

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

  const recentExcerpts = await fetchRecentExcerpts(platforms);
  const noRepeatBlock = buildNoRepeatBlock(recentExcerpts);

  let signalBlock = "";
  try {
    const signal = await fetchTopSignal();
    if (signal) {
      signalBlock = `\nLIVE SIGNAL — today's most relevant live conversation in WVW's niche: "${signal.theme}" (from ${signal.source}, ${signal.momentum.toLowerCase()} momentum). Let at least one of today's platforms respond to or be clearly informed by this — reframed through WVW's structural lens per your current-events alignment rules. Do not force it onto every platform if the fit is weak for that platform's angle, and do not name Reddit or the subreddit in the post itself.\n`;
    }
  } catch {
    // Signal fetch failing should never block content generation
  }

  const prompt = `Generate today's social posts for WVW. ${themeContext}
${noRepeatBlock}${signalBlock}
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
  const { data: recentSubjects } = await supabase
    .from("post_log")
    .select("theme")
    .like("theme", "Black Excellence%")
    .eq("status", "posted")
    .order("created_at", { ascending: false })
    .limit(60);

  const subjectSet = new Set<string>();
  for (const row of recentSubjects ?? []) {
    const parts = (row.theme as string).split(" · ");
    if (parts[2]) subjectSet.add(parts[2]);
  }
  const usedSubjects = [...subjectSet];
  const noRepeatSubjects =
    usedSubjects.length > 0
      ? `\nCRITICAL — NEVER REPEAT THESE SUBJECTS: The following have already been featured. Do NOT spotlight any of them again. Choose someone or something entirely different:\n${usedSubjects.map((s) => `- ${s}`).join("\n")}\n`
      : "";

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
${noRepeatSubjects}
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
  const { data: recentWisdoms } = await supabase
    .from("post_log")
    .select("excerpt")
    .eq("theme", "Unicorn Wisdom")
    .eq("status", "posted")
    .order("created_at", { ascending: false })
    .limit(50);

  const usedWisdoms = [...new Set((recentWisdoms ?? []).map((r) => r.excerpt as string))];
  const noRepeatWisdoms =
    usedWisdoms.length > 0
      ? `\nCRITICAL — NEVER REPEAT: The following Unicorn Wisdoms have already been published. Do NOT repeat, rephrase, echo, or re-use any theme, construction, or structural framing from them:\n${usedWisdoms.map((w) => `- "${w}"`).join("\n")}\n\n`
      : "";

  const msg = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 600,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `${noRepeatWisdoms}Write ${count} original Unicorn Wisdoms for WVW. They should be calm, structurally observant, specific — never hollow affirmations. Two-part constructions work well ("X is Y. Z is the requirement."). Return ONLY a JSON array, no markdown:\n["wisdom 1", "wisdom 2", ...]`,
      },
    ],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "[]";
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Claude did not return valid JSON array");
  return JSON.parse(match[0]) as string[];
}
