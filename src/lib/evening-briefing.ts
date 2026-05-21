import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import { sendSMS } from "@/lib/twilio";
import { todayEST } from "@/lib/time";

const THORNS_ROSES_PROMPTS = [
  "What bloomed and what needed more water today?",
  "Rose and thorn — what shone and what stung?",
  "Where did you show up fully today, and where did the day take from you?",
  "What are you proud of today, and what do you want to release?",
];

async function getRecentEveningContent(): Promise<string[]> {
  const since = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase.from("sms_log").select("body").gte("created_at", since).eq("direction", "outbound").limit(40);
  const roses: string[] = [];
  for (const row of data ?? []) {
    const body = String(row.body ?? "");
    for (const line of body.split("\n")) {
      if (line.startsWith("🌹")) roses.push(line.replace(/^🌹\s*(Rose:|rose:)?\s*/i, "").trim());
    }
  }
  return roses;
}

async function generateEveningReflection(
  closedToday: string[],
  openTasks: string[],
  dayName: string,
): Promise<{ thorn: string; rose: string; focus_tomorrow: string }> {
  const empty = { thorn: "", rose: "", focus_tomorrow: "" };
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return empty;

  const recentRoses = await getRecentEveningContent();
  const noRepeat = recentRoses.length > 0
    ? `NEVER REPEAT these rose affirmations already sent:\n${recentRoses.slice(0, 10).map((r) => `- "${r}"`).join("\n")}\n\n`
    : "";

  try {
    const client = new Anthropic({ apiKey });
    const context = [
      closedToday.length > 0 ? `Completed today: ${closedToday.slice(0, 3).join(", ")}` : "No tasks completed today",
      openTasks.length > 0 ? `Still open: ${openTasks.slice(0, 3).join(", ")}` : "",
    ].filter(Boolean).join(". ");

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `${noRepeat}Write an evening reflection for Tiana Lynn — Black neurodivergent founder of WVW. Today is ${dayName}. ${context}

Return ONLY valid JSON, no markdown:
{
  "rose": "One affirming sentence about something that went well or showed her strength today. Max 80 chars.",
  "thorn": "One honest sentence about what was hard or unfinished. Not harsh. Max 80 chars.",
  "focus_tomorrow": "One clear priority for tomorrow. Actionable. Max 60 chars."
}`,
      }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return empty;
    return { ...empty, ...(JSON.parse(match[0]) as Partial<typeof empty>) };
  } catch {
    return empty;
  }
}

export async function buildAndSendEvening(): Promise<{ sent: boolean; preview: string; sid?: string }> {
  const today = todayEST();
  const dayName = new Date(today + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" });

  const [
    { data: completedToday },
    { data: openTasks },
    { data: overdueTasks },
  ] = await Promise.all([
    supabase.from("tasks").select("title, completed_at").eq("status", "completed").gte("completed_at", today + "T00:00:00").order("completed_at", { ascending: false }),
    supabase.from("tasks").select("title, priority, due_date").in("status", ["open", "in_progress"]).order("priority").limit(5),
    supabase.from("tasks").select("title, due_date").in("status", ["open", "in_progress"]).lt("due_date", today).not("due_date", "is", null).limit(3),
  ]);

  const closedNames = (completedToday ?? []).map((t: { title: string }) => t.title);
  const openNames = (openTasks ?? []).map((t: { title: string }) => t.title);

  const reflection = await generateEveningReflection(closedNames, openNames, dayName);

  const lines: string[] = [];
  const promptIdx = new Date().getDay() % THORNS_ROSES_PROMPTS.length;

  lines.push(`🌙 Evening check-in, Queen. How was your ${dayName}?`);
  lines.push("");

  lines.push(`🌹 Rose: ${reflection.rose || "You showed up. That counts."}`);
  lines.push(`🌵 Thorn: ${reflection.thorn || "Something to carry forward tomorrow."}`);
  lines.push("");

  if (closedNames.length > 0) {
    lines.push(`✅ Done today:`);
    closedNames.slice(0, 3).forEach((t) => lines.push(`• ${t}`));
    lines.push("");
  } else {
    lines.push("📋 No tasks closed today — tomorrow is a fresh start.");
    lines.push("");
  }

  if (openNames.length > 0) {
    lines.push(`📌 Still open (${openNames.length}):`);
    openNames.slice(0, 3).forEach((t) => lines.push(`• ${t}`));
    lines.push("");
  }

  const overdue = (overdueTasks ?? []) as { title: string; due_date: string }[];
  if (overdue.length > 0) {
    lines.push(`⚠️ Overdue: ${overdue.map((t) => t.title).join(", ")}`);
    lines.push("");
  }

  if (reflection.focus_tomorrow) {
    lines.push(`🎯 Tomorrow: ${reflection.focus_tomorrow}`);
    lines.push("");
  }

  lines.push(THORNS_ROSES_PROMPTS[promptIdx]);
  lines.push("");
  lines.push("Rest well. 🌿");

  const body = lines.join("\n");

  const to = process.env.USER_PHONE_NUMBER;
  if (!to) throw new Error("USER_PHONE_NUMBER not set");
  const sid = await sendSMS(to, body);

  supabase.from("sms_log").insert({ direction: "outbound", body }).then(({ error }) => {
    if (error) console.error("[evening-briefing] sms_log:", error.message);
  });

  return { sent: true, preview: body.slice(0, 200), sid };
}
