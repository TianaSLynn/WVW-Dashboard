import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import { sendSMS } from "@/lib/twilio";
import { todayEST } from "@/lib/time";



const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PARSE_SYSTEM = `You parse casual text messages from Tiána (a Pro Black neurodivergent entrepreneur) into structured actions for her personal dashboard.

Return ONLY valid JSON — no explanation, no markdown.

Message types and JSON shapes:
- Task completed: {"action":"complete_task","title":"<task name>"}
- Habit logged: {"action":"log_habit","habit":"<habit name>"}
  Habits include: meditate, ancestors, self care, gym, workout, journal, read, therapy, water, walk, skincare, gratitude, rest
- Bucket list completed: {"action":"complete_bucket","title":"<item>"}
- Book started: {"action":"book_started","title":"<book>","author":"<author if mentioned>"}
- Book finished: {"action":"book_finished","title":"<book>"}
- Win logged: {"action":"log_win","text":"<win description>"}
- New task: {"action":"add_task","title":"<task>","priority":"high|medium|low","category":"personal|business|self_care|health|admin"}
- Unknown: {"action":"unknown","message":"<original text>"}

Examples:
"I went to the gym today" → {"action":"log_habit","habit":"gym"}
"finished reading Untamed" → {"action":"book_finished","title":"Untamed"}
"I completed the client proposal" → {"action":"complete_task","title":"client proposal"}
"I spoke to my ancestors this morning" → {"action":"log_habit","habit":"ancestors"}
"I got a new client today!" → {"action":"log_win","text":"got a new client"}
"add task: schedule dentist, high priority" → {"action":"add_task","title":"schedule dentist","priority":"high","category":"health"}`;

async function parseMessage(text: string): Promise<{ action: string; [key: string]: unknown }> {
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    system: PARSE_SYSTEM,
    messages: [{ role: "user", content: text }],
  });
  const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
  try { return JSON.parse(raw); }
  catch { return { action: "unknown", message: text }; }
}

async function handleAction(parsed: { action: string; [key: string]: unknown }): Promise<string> {
  const today = todayEST();

  switch (parsed.action) {
    case "log_habit": {
      const habitName = String(parsed.habit ?? "").toLowerCase();
      const { data: habits } = await supabase.from("habits").select("id, name").eq("active", true);
      const match = (habits ?? []).find((h) =>
        h.name.toLowerCase().includes(habitName) || habitName.includes(h.name.toLowerCase())
      );
      if (!match) return `I couldn't find a habit matching "${parsed.habit}". Check your habit list in the dashboard.`;
      await supabase.from("habit_logs").upsert({ habit_id: match.id, logged_date: today }, { onConflict: "habit_id,logged_date" });
      return `✅ Logged: ${match.name} for today. Keep showing up, Queen. 💜`;
    }

    case "complete_task": {
      const title = String(parsed.title ?? "");
      const { data: tasks } = await supabase.from("tasks").select("id, title").in("status", ["open","in_progress"]);
      const match = (tasks ?? []).find((t) =>
        t.title.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(t.title.toLowerCase())
      );
      if (!match) {
        // Create and immediately complete it
        await supabase.from("tasks").insert({ title, status: "done", completed_at: new Date().toISOString() });
        return `✅ "${title}" marked complete. You handled that! 🔥`;
      }
      await supabase.from("tasks").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", match.id);
      return `✅ "${match.title}" is done! Crossed off the list. 🙌🏾`;
    }

    case "log_win": {
      const text = String(parsed.text ?? "");
      const dateRecord = await supabase
        .from("daily_intentions")
        .select("id, wins")
        .eq("date", today)
        .single();
      if (dateRecord.data) {
        const wins = [...(dateRecord.data.wins ?? []), text];
        await supabase.from("daily_intentions").update({ wins }).eq("id", dateRecord.data.id);
      } else {
        await supabase.from("daily_intentions").insert({ date: today, wins: [text] });
      }
      return `🏆 Win logged: "${text}". You're out here doing the thing! 👑`;
    }

    case "book_started": {
      const title = String(parsed.title ?? "");
      const author = parsed.author ? String(parsed.author) : null;
      await supabase.from("books").upsert(
        { title, author, status: "reading", started_at: today },
        { onConflict: "title" }
      );
      return `📖 Started: "${title}"${author ? ` by ${author}` : ""}. Happy reading! ✨`;
    }

    case "book_finished": {
      const title = String(parsed.title ?? "");
      const { data } = await supabase.from("books").select("id").ilike("title", `%${title}%`).single();
      if (data) {
        await supabase.from("books").update({ status: "completed", completed_at: today }).eq("id", data.id);
      } else {
        await supabase.from("books").insert({ title, status: "completed", completed_at: today });
      }
      return `📚 "${title}" marked as finished! Another one for the shelf. 🎉`;
    }

    case "complete_bucket": {
      const title = String(parsed.title ?? "");
      const { data } = await supabase.from("bucket_list").select("id, title").ilike("title", `%${title}%`).single();
      if (data) {
        await supabase.from("bucket_list").update({ completed: true, completed_at: new Date().toISOString() }).eq("id", data.id);
        return `✅ Bucket list item checked off: "${data.title}"! You're living your life! 🌍`;
      }
      return `I couldn't find "${title}" on your bucket list. Add it in the dashboard first.`;
    }

    case "add_task": {
      const title = String(parsed.title ?? "");
      const priority = String(parsed.priority ?? "medium");
      const category = String(parsed.category ?? "personal");
      await supabase.from("tasks").insert({ title, priority, category, status: "open" });
      return `📌 Task added: "${title}" (${priority} priority). It's on the list. ✨`;
    }

    default:
      return `I got your message but wasn't sure what to do with it. Try: "I completed [task]", "I meditated today", "I finished reading [book]", or "add task: [what]".`;
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const body = formData.get("Body")?.toString() ?? "";
  const from = formData.get("From")?.toString() ?? "";

  // Only accept from the owner's number
  const ownerNumber = process.env.USER_PHONE_NUMBER;
  if (ownerNumber && from !== ownerNumber) {
    return new Response('<Response></Response>', { headers: { "Content-Type": "text/xml" } });
  }

  if (!body.trim()) {
    return new Response('<Response></Response>', { headers: { "Content-Type": "text/xml" } });
  }

  // Log incoming
  await supabase.from("sms_log").insert({ direction: "inbound", body });

  let reply = "Got it! 💜";
  try {
    const parsed = await parseMessage(body);
    await supabase.from("sms_log").update({ parsed_action: parsed.action, parsed_data: parsed }).eq("body", body);
    reply = await handleAction(parsed);
  } catch (err) {
    console.error("SMS parse error:", err);
  }

  // Send reply via Twilio (using TwiML)
  const to = process.env.USER_PHONE_NUMBER;
  if (to) {
    await sendSMS(to, reply).catch(() => {});
  }

  return new Response(`<Response></Response>`, { headers: { "Content-Type": "text/xml" } });
}
