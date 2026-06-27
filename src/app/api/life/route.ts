import { supabase } from "@/lib/supabase";
import { todayEST, weekStartEST } from "@/lib/time";
import { buildAndSendMorning } from "@/lib/morning-briefing";
import { buildAndSendEvening } from "@/lib/evening-briefing";

export const dynamic = "force-dynamic";
export const runtime = 'edge';

function currentQuarter(today: string): { quarter: string; year: number; quarter_num: number } {
  const [y, m] = today.split("-").map(Number);
  const q = Math.ceil(m / 3);
  return { quarter: `${y}-Q${q}`, year: y, quarter_num: q };
}

export async function GET() {
  const today = todayEST();
  const weekStartStr = weekStartEST();
  const weekEndDate = new Date(weekStartStr + "T12:00:00");
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekEndStr = weekEndDate.toISOString().split("T")[0];

  const currentMonth = today.slice(0, 7);
  const monthStart = currentMonth + "-01";
  const { quarter, year } = currentQuarter(today);

  // Last 7 days for energy sparkline
  const sevenDaysAgo = new Date(today + "T12:00:00");
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  const [
    { data: habits },
    { data: habitLogs },
    { data: habitLogsMonth },
    { data: tasks },
    { data: weekPlan },
    { data: todayIntention },
    { data: books },
    { data: bucketList },
    { data: waterLog },
    { data: medications },
    { data: medLogs },
    { data: spiritSigns },
    { data: sleepLog },
    { data: monthlyReview },
    { data: quarterlyReview },
    { data: annualReview },
    { data: recentIntentions },
  ] = await Promise.all([
    supabase.from("habits").select("*").eq("active", true).order("sort_order"),
    supabase.from("habit_logs").select("*").gte("logged_date", weekStartStr).lte("logged_date", weekEndStr),
    supabase.from("habit_logs").select("*").gte("logged_date", monthStart).lte("logged_date", today),
    supabase.from("tasks").select("*").order("priority").order("created_at", { ascending: false }),
    supabase.from("weekly_intentions").select("*").eq("week_start", weekStartStr).single(),
    supabase.from("daily_intentions").select("*").eq("date", today).single(),
    supabase.from("books").select("*").order("created_at", { ascending: false }),
    supabase.from("bucket_list").select("*").order("completed").order("created_at", { ascending: false }),
    supabase.from("water_logs").select("*").eq("date", today).single(),
    supabase.from("medications").select("*").eq("active", true).order("sort_order"),
    supabase.from("medication_logs").select("*").eq("date", today),
    supabase.from("spirituality_signs").select("*").order("category").order("name"),
    supabase.from("sleep_logs").select("*").eq("date", today).single(),
    supabase.from("monthly_reviews").select("*").eq("month", currentMonth).single(),
    supabase.from("quarterly_reviews").select("*").eq("quarter", quarter).single(),
    supabase.from("annual_reviews").select("*").eq("year", year).single(),
    supabase.from("daily_intentions").select("date,energy_level,nervous_system,mood,social_battery").gte("date", sevenDaysAgoStr).lte("date", today).order("date"),
  ]);

  return Response.json({
    habits: habits ?? [],
    habitLogs: habitLogs ?? [],
    habitLogsMonth: habitLogsMonth ?? [],
    tasks: tasks ?? [],
    weekPlan: weekPlan ?? null,
    todayIntention: todayIntention ?? null,
    books: books ?? [],
    bucketList: bucketList ?? [],
    waterLog: waterLog ?? null,
    medications: medications ?? [],
    medLogs: medLogs ?? [],
    spiritSigns: spiritSigns ?? [],
    sleepLog: sleepLog ?? null,
    monthlyReview: monthlyReview ?? null,
    quarterlyReview: quarterlyReview ?? null,
    annualReview: annualReview ?? null,
    recentIntentions: recentIntentions ?? [],
    today,
    weekStart: weekStartStr,
    monthStart,
    currentMonth,
    currentQuarter: quarter,
    currentYear: year,
  });
}

function dbErr(error: { message?: string } | null, context: string): Response | null {
  if (!error) return null;
  console.error(`[life POST] ${context}:`, error.message);
  return Response.json({ ok: false, error: error.message ?? "Database error" }, { status: 500 });
}

export async function POST(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = await req.json() as any;
  const today = todayEST();

  switch (body.type as string) {
    case "toggle_habit": {
      const habitId = String(body.habitId);
      const date = String(body.date ?? today);
      const logged = Boolean(body.logged);
      if (logged) {
        const { error } = await supabase.from("habit_logs").delete().eq("habit_id", habitId).eq("logged_date", date);
        return dbErr(error, "toggle_habit delete") ?? Response.json({ ok: true });
      } else {
        const { error } = await supabase.from("habit_logs").upsert({ habit_id: habitId, logged_date: date }, { onConflict: "habit_id,logged_date" });
        return dbErr(error, "toggle_habit upsert") ?? Response.json({ ok: true });
      }
    }

    case "add_task": {
      const title = String(body.title ?? "");
      const priority = String(body.priority ?? "medium");
      const category = String(body.category ?? "personal");
      const due_date = body.due_date ? String(body.due_date) : null;
      const notes = body.notes ? String(body.notes) : null;
      const { data, error } = await supabase.from("tasks").insert({ title, priority, category, due_date, notes, status: "open" }).select().single();
      return dbErr(error, "add_task") ?? Response.json({ ok: true, task: data });
    }

    case "update_task": {
      const { type: _t, id, ...fields } = body as Record<string, unknown>;
      const { error } = await supabase.from("tasks").update(fields).eq("id", String(id));
      return dbErr(error, "update_task") ?? Response.json({ ok: true });
    }

    case "save_week_plan": {
      const { type: _t, week_start, main_focus, goals, word_of_week, intentions } = body as Record<string, unknown>;
      const { error } = await supabase.from("weekly_intentions").upsert({ week_start, main_focus, goals, word_of_week, intentions }, { onConflict: "week_start" });
      return dbErr(error, "save_week_plan") ?? Response.json({ ok: true });
    }

    case "save_intention": {
      const top3 = Array.isArray(body.top3) ? body.top3 : [];
      const energy_level = body.energy_level != null ? Number(body.energy_level) : null;
      const nervous_system = body.nervous_system ? String(body.nervous_system) : null;
      const morning_note = body.morning_note ? String(body.morning_note) : null;
      const evening_note = body.evening_note ? String(body.evening_note) : null;
      const gratitude = Array.isArray(body.gratitude) ? body.gratitude as string[] : [];
      const brain_dump = body.brain_dump ? String(body.brain_dump) : null;
      const one_thing = body.one_thing ? String(body.one_thing) : null;
      const social_battery = body.social_battery != null ? Number(body.social_battery) : null;
      const mood = body.mood ? String(body.mood) : null;
      const recharge = body.recharge ? String(body.recharge) : null;
      const alignment_note = body.alignment_note ? String(body.alignment_note) : null;
      const { error } = await supabase.from("daily_intentions").upsert(
        { date: today, top3, energy_level, nervous_system, morning_note, evening_note, gratitude, brain_dump, one_thing, social_battery, mood, recharge, alignment_note },
        { onConflict: "date" }
      );
      return dbErr(error, "save_intention") ?? Response.json({ ok: true });
    }

    case "save_brain_dump": {
      const brain_dump = body.brain_dump ? String(body.brain_dump) : "";
      const { error } = await supabase.from("daily_intentions").upsert({ date: today, brain_dump }, { onConflict: "date" });
      return dbErr(error, "save_brain_dump") ?? Response.json({ ok: true });
    }

    case "save_one_thing": {
      const one_thing = body.one_thing ? String(body.one_thing) : "";
      const { error } = await supabase.from("daily_intentions").upsert({ date: today, one_thing }, { onConflict: "date" });
      return dbErr(error, "save_one_thing") ?? Response.json({ ok: true });
    }

    case "save_monthly_review": {
      const { type: _t, month, ...fields } = body as Record<string, unknown>;
      const { error } = await supabase.from("monthly_reviews").upsert({ month: String(month), ...fields }, { onConflict: "month" });
      return dbErr(error, "save_monthly_review") ?? Response.json({ ok: true });
    }

    case "save_quarterly_review": {
      const { type: _t, quarter: q, year: y, quarter_num: qn, ...fields } = body as Record<string, unknown>;
      if ("alignment_score" in fields && fields.alignment_score != null) {
        fields.alignment_score = Number(fields.alignment_score);
      }
      const { error } = await supabase.from("quarterly_reviews").upsert(
        { quarter: String(q), year: Number(y), quarter_num: Number(qn), ...fields },
        { onConflict: "quarter" }
      );
      return dbErr(error, "save_quarterly_review") ?? Response.json({ ok: true });
    }

    case "save_annual_review": {
      const { type: _t, year: y, ...fields } = body as Record<string, unknown>;
      const { error } = await supabase.from("annual_reviews").upsert({ year: Number(y), ...fields }, { onConflict: "year" });
      return dbErr(error, "save_annual_review") ?? Response.json({ ok: true });
    }

    case "add_book": {
      const title = String(body.title ?? "");
      const author = body.author ? String(body.author) : null;
      const status = String(body.status ?? "want_to_read");
      const genre = body.genre ? String(body.genre) : null;
      const cover_url = body.cover_url ? String(body.cover_url) : null;
      const media_type = body.media_type ? String(body.media_type) : "book";
      const { data, error } = await supabase.from("books").insert({ title, author, status, genre, cover_url, media_type }).select().single();
      return dbErr(error, "add_book") ?? Response.json({ ok: true, book: data });
    }

    case "update_book": {
      const { type: _t, id, ...fields } = body as Record<string, unknown>;
      if (fields.status === "reading" && !fields.started_at) fields.started_at = today;
      if (fields.status === "completed" && !fields.completed_at) fields.completed_at = today;
      const { error } = await supabase.from("books").update(fields).eq("id", String(id));
      return dbErr(error, "update_book") ?? Response.json({ ok: true });
    }

    case "add_bucket": {
      const title = String(body.title ?? "");
      const category = String(body.category ?? "experience");
      const notes = body.notes ? String(body.notes) : null;
      const { data, error } = await supabase.from("bucket_list").insert({ title, category, notes }).select().single();
      return dbErr(error, "add_bucket") ?? Response.json({ ok: true, item: data });
    }

    case "toggle_bucket": {
      const id = String(body.id);
      const completed = Boolean(body.completed);
      const { error } = await supabase.from("bucket_list").update({ completed, completed_at: completed ? new Date().toISOString() : null }).eq("id", id);
      return dbErr(error, "toggle_bucket") ?? Response.json({ ok: true });
    }

    case "set_water": {
      const cups = Number(body.cups ?? 0);
      const goal_cups = Number(body.goal_cups ?? 8);
      const { error } = await supabase.from("water_logs").upsert({ date: today, cups, goal_cups }, { onConflict: "date" });
      return dbErr(error, "set_water") ?? Response.json({ ok: true });
    }

    case "log_sleep": {
      const hours = body.hours !== undefined && body.hours !== null ? Number(body.hours) : null;
      const quality = body.quality !== undefined && body.quality !== null && body.quality !== 0 ? Number(body.quality) : null;
      const notes = body.notes ? String(body.notes) : null;
      const bedtime = body.bedtime ? String(body.bedtime) : null;
      const wake_time = body.wake_time ? String(body.wake_time) : null;
      const { error } = await supabase.from("sleep_logs").upsert({ date: today, hours, quality, notes, bedtime, wake_time }, { onConflict: "date" });
      return dbErr(error, "log_sleep") ?? Response.json({ ok: true });
    }

    case "log_medication": {
      const medication_name = String(body.medication_name ?? "");
      const taken = Boolean(body.taken);
      const dose = body.dose ? String(body.dose) : null;
      const symptoms = body.symptoms ?? [];
      const notes = body.notes ? String(body.notes) : null;
      const { data: existing } = await supabase.from("medication_logs").select("id").eq("date", today).eq("medication_name", medication_name).single();
      if (existing) {
        const { error } = await supabase.from("medication_logs").update({ taken, dose, symptoms, notes, taken_at: taken ? new Date().toISOString() : null }).eq("id", existing.id);
        return dbErr(error, "log_medication update") ?? Response.json({ ok: true });
      } else {
        const { error } = await supabase.from("medication_logs").insert({ date: today, medication_name, taken, dose, symptoms, notes, taken_at: taken ? new Date().toISOString() : null });
        return dbErr(error, "log_medication insert") ?? Response.json({ ok: true });
      }
    }

    case "add_medication": {
      const name = String(body.name ?? "");
      const dose = body.dose ? String(body.dose) : null;
      const frequency = String(body.frequency ?? "daily");
      const when_to_take = body.when_to_take ? String(body.when_to_take) : null;
      const symptoms_to_track = body.symptoms_to_track ?? [];
      const notes = body.notes ? String(body.notes) : null;
      const { data, error } = await supabase.from("medications").insert({ name, dose, frequency, when_to_take, symptoms_to_track, notes }).select().single();
      return dbErr(error, "add_medication") ?? Response.json({ ok: true, medication: data });
    }

    case "add_spirit_sign": {
      const { type: _t, ...fields } = body as Record<string, unknown>;
      const { data, error } = await supabase.from("spirituality_signs").insert(fields).select().single();
      return dbErr(error, "add_spirit_sign") ?? Response.json({ ok: true, sign: data });
    }

    case "update_spirit_sign": {
      const { type: _t, id, ...fields } = body as Record<string, unknown>;
      const { error } = await supabase.from("spirituality_signs").update(fields).eq("id", String(id));
      return dbErr(error, "update_spirit_sign") ?? Response.json({ ok: true });
    }

    case "send_morning_text": {
      try {
        const result = await buildAndSendMorning();
        return Response.json({ ok: true, sent: result.sent, preview: result.preview, sid: result.sid });
      } catch (err) {
        return Response.json({ ok: false, error: String(err) }, { status: 500 });
      }
    }

    case "send_evening_text": {
      try {
        const result = await buildAndSendEvening();
        return Response.json({ ok: true, sent: result.sent, preview: result.preview, sid: result.sid });
      } catch (err) {
        return Response.json({ ok: false, error: String(err) }, { status: 500 });
      }
    }

    default:
      return Response.json({ error: "Unknown type" }, { status: 400 });
  }
}
