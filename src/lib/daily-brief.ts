import Anthropic from "@anthropic-ai/sdk";

export const WORKOUT_SPLIT: Record<number, { focus: string; theme: string }> = {
  0: { focus: "Rest / Gentle Walk + Deep Stretch", theme: "reverence, reflection, integration" },
  1: { focus: "Legs", theme: "grounding, stability, foundation" },
  2: { focus: "Upper Body", theme: "posture, strength, boundaries" },
  3: { focus: "Abs / Core", theme: "center, protection, truth" },
  4: { focus: "Full Body", theme: "power, resilience, capacity" },
  5: { focus: "Glutes + Hips", theme: "creation, release, sovereignty" },
  6: { focus: "Mobility + Flow", theme: "softness, restoration, nervous system care" },
};

export interface RoomWord {
  word: string;
  room: string;
  definition: string;
  room_use: string;
  my_use: string;
  caution: string | null;
}

export interface DailyBrief {
  vibe_line: string;
  word_of_day: string;
  energy_to_protect: string;
  ps_action: string;
  spa_action: string;
  lxe_action: string;
  code_today: string;
  astro_theme: string;
  astro_emotional_weather: string;
  astro_power_move: string;
  astro_avoid: string;
  astro_affirmation: string;
  herb_primary: string;
  herb_primary_why: string;
  herb_primary_how: string;
  herb_supporting: string;
  herb_supporting_why: string;
  herb_supporting_how: string;
  herb_safety: string;
  workout_focus: string;
  workout_theme: string;
  workout_warmup: string;
  workout_beginner: string;
  workout_levelup: string;
  workout_cooldown: string;
  workout_win_condition: string;
  linkedin_personal: string;
  linkedin_wvw: string;
  facebook: string;
  be_name: string;
  be_who: string;
  be_what: string[];
  be_why: string[];
  be_mirrors: string[];
  be_quote: string;
  prompt_healing: string;
  prompt_ceo: string;
  prompt_creative: string;
  embodiment_action: string;
  room_words: RoomWord[];
}

export interface EveningBrief {
  reflection_theme: string;
  energy_integration: string;
  body_release: string;
  ritual_primary: string;
  ritual_why: string;
  ritual_how: string;
  wind_down_practice: string;
  prompt_release: string;
  prompt_integration: string;
  prompt_gratitude: string;
  tomorrow_seed: string;
  closing_affirmation: string;
}

const CONTEXT_HEADER = `Tiána Lynn — Black neurodivergent founder of WVW (Wholistic Vibes Wellness). Capricorn sun, born Jan 15 1986.
WVW PILLARS: Psychological Safety | Black Mental Health | Black Neurodivergence | Systems & Power Awareness | Lived Experience as Expertise
VOICE: Political clarity (Jasmine Crockett energy). Poetic cadence (Lynae Vanee energy). Never imitate or quote them.
BRAND: "Soft in appearance. Uncompromising in practice."
NO: corporate fluff, hollow affirmations, "Let's normalize...", toxic positivity, preachy tone.`;

function parseJson<T>(raw: string): Partial<T> {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try { return JSON.parse(match[0]) as Partial<T>; } catch { return {}; }
}

async function generateBriefPart1(
  client: Anthropic,
  dayName: string,
  date: string,
  dayOfWeek: number,
  noRepeatBE: string,
): Promise<Partial<DailyBrief>> {
  const split = WORKOUT_SPLIT[dayOfWeek] ?? WORKOUT_SPLIT[1];
  const prompt = `${CONTEXT_HEADER}

Today is ${dayName}, ${date}. TODAY'S WORKOUT: ${split.focus} — ${split.theme}${noRepeatBE}

Return ONLY valid JSON. No markdown. Escape newlines as \\n:
{
  "vibe_line": "1 evocative specific line — today's energy. Not generic.",
  "word_of_day": "one word",
  "energy_to_protect": "1 line — what she must guard today",
  "ps_action": "Psychological Safety — how she will move/speak/protect space today. 1 precise sentence.",
  "spa_action": "Systems & Power Awareness — what she will notice, name, or interrupt. 1 precise sentence.",
  "lxe_action": "Lived Experience as Expertise — how she honors her story as authority today. 1 sentence.",
  "code_today": "Code I Live By Today. 1-2 grounded poetic sentences. Real and structural.",
  "astro_theme": "Theme for Capricorn sun today. 1 sentence.",
  "astro_emotional_weather": "Emotional weather. 1 sentence.",
  "astro_power_move": "One specific action for today. Start with a verb.",
  "astro_avoid": "One specific avoidance cue. Start with Avoid.",
  "astro_affirmation": "1 declarative embodied line. Not hollow.",
  "herb_primary": "Primary herb name. Not white sage. Ethically sourced.",
  "herb_primary_why": "Why it aligns with today's vibe. 1 sentence.",
  "herb_primary_how": "Simple use instructions. 1 sentence.",
  "herb_supporting": "Supporting herb or smoke-free alternative.",
  "herb_supporting_why": "1 sentence.",
  "herb_supporting_how": "1 sentence.",
  "herb_safety": "Ventilation, pets/asthma awareness, non-smoke option. 1 sentence.",
  "workout_focus": "${split.focus}",
  "workout_theme": "${split.theme}",
  "workout_warmup": "4-6 min warmup. 3-4 movements with duration. Numbered list using \\n.",
  "workout_beginner": "Beginner bodyweight circuit. 5-6 exercises with sets/reps. Numbered using \\n. Include form cue per exercise.",
  "workout_levelup": "Level-up harder variations. Numbered using \\n.",
  "workout_cooldown": "4-6 min cooldown. 3-4 stretches with hold time. Numbered using \\n.",
  "workout_win_condition": "1 sentence — what counts as a win on a low-energy day.",
  "be_name": "Full name of Black excellence spotlight person. Must be real.",
  "be_who": "Who they are. 1 sentence.",
  "be_what": ["concrete achievement 1", "achievement 2", "achievement 3"],
  "be_why": ["why it matters 1", "why 2", "why 3"],
  "be_mirrors": ["how their work mirrors Tiána/WVW 1", "connection 2", "connection 3"],
  "be_quote": "A real or paraphrased quote. Label paraphrased if not verbatim.",
  "prompt_healing": "1 personal healing journal prompt. Specific and embodied.",
  "prompt_ceo": "1 CEO/operations journal prompt. Structural and practical.",
  "prompt_creative": "1 creative/spoken-word prompt. Evocative.",
  "embodiment_action": "1-minute somatic embodiment action to do immediately after writing."
}`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  return parseJson<DailyBrief>(raw);
}

async function generateBriefPart2(
  client: Anthropic,
  dayName: string,
  date: string,
): Promise<Partial<DailyBrief>> {
  const prompt = `${CONTEXT_HEADER}

Today is ${dayName}, ${date}.

Return ONLY valid JSON. No markdown. Escape newlines as \\n:
{
  "linkedin_personal": "FULL post. 140-240 words. Strong opening hook (NOT 'I' as first word). Black lived experience and leadership. Voice: Jasmine Crockett + Lynae Vanee energy. End with ONE reflective question (not 'thoughts?'). Hashtags on last line. Use \\n for line breaks.",
  "linkedin_wvw": "FULL post. 130-220 words. Written as 'we' (the brand). Explicitly names one WVW pillar. Luxury positioning. Subtle confident collaboration invitation. Hashtags on last line. Use \\n for line breaks.",
  "facebook": "FULL post. Label first line as 'WVW Page:' or 'Personal Page:'. 90-170 words. Conversational but intentional. Include labeled line: 'Today\\'s Intention: [one sentence]'. Hashtags on last line. Use \\n for line breaks.",
  "room_words": [
    {"word": "word1", "room": "Executive / Boardroom / Leadership", "definition": "plain language", "room_use": "1 sentence", "my_use": "1 sentence aligned with WVW values", "caution": "1 sentence or null"},
    {"word": "word2", "room": "Academic / Policy / Research", "definition": "plain language", "room_use": "1 sentence", "my_use": "1 sentence", "caution": "1 sentence or null"},
    {"word": "word3", "room": "Spiritual / Healing / Ancestral", "definition": "plain language", "room_use": "1 sentence", "my_use": "1 sentence", "caution": "1 sentence or null"},
    {"word": "word4", "room": "Media / Public Narrative / Messaging", "definition": "plain language", "room_use": "1 sentence", "my_use": "1 sentence", "caution": "1 sentence or null"}
  ]
}`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  return parseJson<DailyBrief>(raw);
}

export async function generateDailyBrief(
  dayName: string,
  date: string,
  dayOfWeek: number,
  recentBENames: string[] = [],
): Promise<DailyBrief | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const noRepeatBE = recentBENames.length > 0
    ? `\n\nNEVER spotlight these people (already featured recently): ${recentBENames.join(", ")}.`
    : "";

  try {
    const client = new Anthropic({ apiKey });
    const [part1, part2] = await Promise.all([
      generateBriefPart1(client, dayName, date, dayOfWeek, noRepeatBE),
      generateBriefPart2(client, dayName, date),
    ]);
    const merged = { ...part1, ...part2 } as DailyBrief;
    if (!merged.vibe_line) return null;
    return merged;
  } catch (err) {
    console.error("[daily-brief] morning generation failed:", String(err));
    return null;
  }
}

export async function generateEveningBrief(
  dayName: string,
  dayOfWeek: number,
  closedTasks: string[],
  openTasks: string[],
  energyLevel?: number,
  mood?: string,
): Promise<EveningBrief | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const split = WORKOUT_SPLIT[dayOfWeek] ?? WORKOUT_SPLIT[1];
  const ctx = [
    closedTasks.length > 0 ? `Completed: ${closedTasks.slice(0, 4).join(", ")}` : "No tasks completed today.",
    openTasks.length > 0 ? `Still open: ${openTasks.slice(0, 3).join(", ")}` : "",
    energyLevel ? `Energy: ${energyLevel}/5` : "",
    mood ? `Mood: ${mood}` : "",
  ].filter(Boolean).join(" | ");

  const prompt = `You are the evening integration guide for Tiána Lynn, founder of WVW (Wholistic Vibes Wellness). Tonight is ${dayName}.

Today's embodied theme: ${split.focus} — ${split.theme}
Day context: ${ctx}

This is for nervous system restoration and integration. Not performance. Not hustle. Black womanhood is reverenced here — rest is not earned, it is required.

Return ONLY valid JSON. No markdown. Escape newlines as \\n:
{
  "reflection_theme": "1 sentence — tonight's integration theme",
  "energy_integration": "1-2 sentences — how to honor and close today's energy. Grounded, not spiritual bypassing.",
  "body_release": "1 sentence — a somatic/physical release practice for tonight",
  "ritual_primary": "Primary evening ritual (herb, tea, breath, movement, etc.)",
  "ritual_why": "Why this fits tonight. 1 sentence.",
  "ritual_how": "How to do it. 1 sentence.",
  "wind_down_practice": "A specific nervous system wind-down sequence. 2-3 sentences. Sequential steps.",
  "prompt_release": "1 evening release/letting-go prompt",
  "prompt_integration": "1 integration prompt about today's meaning",
  "prompt_gratitude": "1 gratitude anchor prompt. Grounded, not performative.",
  "tomorrow_seed": "1 sentence — a seed intention to plant tonight for tomorrow morning. Not a to-do.",
  "closing_affirmation": "1-2 sentences. Closing affirmation for sleep. Real and hers."
}`;

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as EveningBrief;
  } catch (err) {
    console.error("[daily-brief] evening generation failed:", String(err));
    return null;
  }
}
