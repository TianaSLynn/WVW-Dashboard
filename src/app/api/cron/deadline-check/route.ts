import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendDeadlineAlert } from "@/lib/email";
import { todayEST, daysFromTodayEST } from "@/lib/time";

export const runtime = 'edge';

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

  const [
    { data: overdue },
    { data: dueToday },
    { data: dueTomorrow },
    { data: dueSoon },
  ] = await Promise.all([
    supabase.from("tasks").select("title, due_date").in("status", ["open", "in_progress"]).lt("due_date", today).not("due_date", "is", null),
    supabase.from("tasks").select("title").in("status", ["open", "in_progress"]).eq("due_date", today),
    supabase.from("tasks").select("title").in("status", ["open", "in_progress"]).eq("due_date", tomorrowStr),
    supabase.from("tasks").select("title, due_date").in("status", ["open", "in_progress"]).gt("due_date", tomorrowStr).lte("due_date", in3DaysStr),
  ]);

  const hasAlerts =
    (overdue ?? []).length > 0 ||
    (dueToday ?? []).length > 0 ||
    (dueTomorrow ?? []).length > 0 ||
    (dueSoon ?? []).length > 0;

  if (!hasAlerts) {
    return Response.json({ sent: false, reason: "No upcoming deadlines" });
  }

  try {
    const emailId = await sendDeadlineAlert({
      overdue: (overdue ?? []) as { title: string; due_date: string }[],
      dueToday: (dueToday ?? []) as { title: string }[],
      dueTomorrow: (dueTomorrow ?? []) as { title: string }[],
      dueSoon: (dueSoon ?? []) as { title: string; due_date: string }[],
    });
    return Response.json({ sent: true, emailId });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
