import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendMorningText } from "@/lib/twilio";
import { todayEST, daysFromTodayEST } from "@/lib/time";

export const maxDuration = 30;

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const today = todayEST();
  const tomorrowStr = daysFromTodayEST(1);
  const in3DaysStr = daysFromTodayEST(3);

  // Overdue
  const { data: overdue } = await supabase
    .from("tasks")
    .select("title, due_date")
    .in("status", ["open", "in_progress"])
    .lt("due_date", today)
    .not("due_date", "is", null);

  // Due today
  const { data: dueToday } = await supabase
    .from("tasks")
    .select("title")
    .in("status", ["open", "in_progress"])
    .eq("due_date", today);

  // Due tomorrow
  const { data: dueTomorrow } = await supabase
    .from("tasks")
    .select("title")
    .in("status", ["open", "in_progress"])
    .eq("due_date", tomorrowStr);

  // Due within 3 days
  const { data: dueSoon } = await supabase
    .from("tasks")
    .select("title, due_date")
    .in("status", ["open", "in_progress"])
    .gt("due_date", tomorrowStr)
    .lte("due_date", in3DaysStr);

  const lines: string[] = [];
  let hasAlerts = false;

  if ((overdue ?? []).length > 0) {
    hasAlerts = true;
    lines.push("⚠️ OVERDUE — these need your attention:");
    (overdue ?? []).forEach((t) => lines.push(`• ${t.title} (was due ${t.due_date})`));
    lines.push("");
  }

  if ((dueToday ?? []).length > 0) {
    hasAlerts = true;
    lines.push("🔥 DUE TODAY:");
    (dueToday ?? []).forEach((t) => lines.push(`• ${t.title}`));
    lines.push("");
  }

  if ((dueTomorrow ?? []).length > 0) {
    hasAlerts = true;
    lines.push("⏰ DUE TOMORROW:");
    (dueTomorrow ?? []).forEach((t) => lines.push(`• ${t.title}`));
    lines.push("");
  }

  if ((dueSoon ?? []).length > 0) {
    hasAlerts = true;
    lines.push("📅 COMING UP (next 3 days):");
    (dueSoon ?? []).forEach((t) => lines.push(`• ${t.title} — due ${t.due_date}`));
    lines.push("");
  }

  if (!hasAlerts) {
    return Response.json({ sent: false, reason: "No upcoming deadlines" });
  }

  lines.unshift("🌙 Evening check-in, Queen 💜\n");
  lines.push("Reply 'done: [task]' to mark anything complete. You got this. 👑");

  const body = lines.join("\n");

  try {
    await sendMorningText(body);
    await supabase.from("sms_log").insert({ direction: "outbound", body });
    return Response.json({ sent: true });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
