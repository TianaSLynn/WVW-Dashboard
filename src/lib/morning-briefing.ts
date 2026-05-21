import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import { sendMorningText } from "@/lib/twilio";
import { todayEST, weekStartEST, dayNameEST } from "@/lib/time";

const PRIORITY_EMOJI: Record<string, string> = { high: "🔥", medium: "⚡", low: "📝" };
const DAY_EMOJI = ["☀️","🌟","✨","💫","🌸","🎉","🌙"];

const SIGNOFFS = [
  "You got this, Queen. 👑",
  "Walk into today like the force you are.",
  "Soft in appearance. Uncompromising in practice.",
  "Your nervous system is sacred. Protect it.",
  "One intentional step at a time. You're already doing it.",
  "Rest is not the enemy of progress. Pace yourself.",
  "Your ancestors are with you today. Go be great.",
];

async function fetchWeather(): Promise<string> {
  const location = process.env.WEATHER_LOCATION ?? "New York";
  try {
    const res = await fetch(
      `https://wttr.in/${encodeURIComponent(location)}?format=%C,+%t,+feels+%f`,
      { headers: { "User-Agent": "WVW-Dashboard/1.0" }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return "";
    const text = (await res.text()).trim();
    return text.length < 80 ? text : text.slice(0, 80);
  } catch {
    return "";
  }
}

interface MorningExtras {
  wisdom: string;
  black_fact: string;
  song: string;
}

async function getRecentSmsExtras(): Promise<{ wisdoms: string[]; facts: string[]; songs: string[] }> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase.from("sms_log").select("body").gte("created_at", since).eq("direction", "outbound").limit(60);
  const wisdoms: string[] = [];
  const facts: string[] = [];
  const songs: string[] = [];
  for (const row of data ?? []) {
    const body = String(row.body ?? "");
    for (const line of body.split("\n")) {
      if (line.startsWith("🦄")) wisdoms.push(line.replace(/^🦄\s*/, "").trim());
      if (line.startsWith("✊")) facts.push(line.replace(/^✊[🏾]?\s*/, "").trim());
      if (line.startsWith("🎵")) songs.push(line.replace(/^🎵\s*/, "").trim());
    }
  }
  return { wisdoms, facts, songs };
}

async function generateExtras(dayName: string): Promise<MorningExtras> {
  const empty: MorningExtras = { wisdom: "", black_fact: "", song: "" };
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return empty;

  const recent = await getRecentSmsExtras();

  const noRepeat = [
    recent.wisdoms.length > 0 ? `NEVER REPEAT these wisdoms (already sent):\n${recent.wisdoms.map((w) => `- "${w}"`).join("\n")}` : "",
    recent.facts.length > 0 ? `NEVER REPEAT these Black facts/people (already sent):\n${recent.facts.map((f) => `- "${f}"`).join("\n")}` : "",
    recent.songs.length > 0 ? `NEVER REPEAT these songs (already sent): ${recent.songs.join(", ")}` : "",
  ].filter(Boolean).join("\n\n");

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 250,
      messages: [{
        role: "user",
        content: `Today is ${dayName}. You are creating a morning briefing for Tiána Lynn — Black neurodivergent founder of WVW.

${noRepeat}

Return ONLY valid JSON, no markdown:
{
  "wisdom": "One short sentence of WVW wisdom. Structural, never hollow. Max 80 chars.",
  "black_fact": "One sentence. Real Black person's achievement — name them specifically. Max 90 chars.",
  "song": "Artist - Song Title. A Black artist. Match day energy. Max 40 chars."
}`,
      }],
    });
    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return empty;
    return { ...empty, ...(JSON.parse(match[0]) as Partial<MorningExtras>) };
  } catch {
    return empty;
  }
}

export async function buildAndSendMorning(): Promise<{ sent: boolean; preview: string; sid?: string }> {
  const today = todayEST();
  const dayName = dayNameEST();
  const dayOfWeek = new Date(today + "T12:00:00").getDay();

  const [
    weather,
    { data: tasks },
    { data: overdue },
    { data: weekPlan },
  ] = await Promise.all([
    fetchWeather(),
    supabase.from("tasks").select("title, priority").in("status", ["open","in_progress"]).order("priority").limit(5),
    supabase.from("tasks").select("title").in("status", ["open","in_progress"]).lt("due_date", today).not("due_date", "is", null).limit(2),
    supabase.from("weekly_intentions").select("main_focus, word_of_week").eq("week_start", weekStartEST()).single(),
  ]);

  // generateExtras queries sms_log for recent history — run after initial parallel fetch
  const extras = await generateExtras(dayName);

  const parts: string[] = [];

  // Greeting + weather on one line
  const greeting = `${DAY_EMOJI[dayOfWeek]} Morning, Queen! ${dayName}${weather ? ` | ${weather}` : ""}`;
  parts.push(greeting);

  // Wisdom + fact + song condensed
  if (extras.wisdom) parts.push(`🦄 ${extras.wisdom}`);
  if (extras.black_fact) parts.push(`✊🏾 ${extras.black_fact}`);
  if (extras.song) parts.push(`🎵 ${extras.song}`);

  // Focus
  const focus = (weekPlan as { main_focus?: string; word_of_week?: string } | null);
  if (focus?.main_focus) parts.push(`🎯 ${focus.main_focus}`);

  // Top 2 tasks only
  const sortedTasks = ((tasks ?? []) as { title: string; priority: string }[])
    .sort((a, b) => ["high","medium","low"].indexOf(a.priority) - ["high","medium","low"].indexOf(b.priority))
    .slice(0, 2);

  if (sortedTasks.length > 0) {
    const taskLines = sortedTasks.map((t, i) => `${i + 1}. ${PRIORITY_EMOJI[t.priority] ?? ""}${t.title}`).join("\n");
    parts.push(`📋 Today:\n${taskLines}`);
  }

  // Overdue (1 max)
  const overdueList = (overdue ?? []) as { title: string }[];
  if (overdueList.length > 0) parts.push(`⚠️ Overdue: ${overdueList[0].title}`);

  parts.push(SIGNOFFS[dayOfWeek]);

  // Cap at 600 chars to stay under 5 segments
  let body = parts.join("\n");
  if (body.length > 600) body = body.slice(0, 597) + "…";

  const sid = await sendMorningText(body);

  supabase.from("sms_log").insert({ direction: "outbound", body }).then(({ error }) => {
    if (error) console.error("[morning-briefing] sms_log:", error.message);
  });

  return { sent: true, preview: body.slice(0, 200), sid };
}
