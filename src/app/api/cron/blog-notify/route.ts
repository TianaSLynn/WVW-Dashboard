import { NextRequest } from "next/server";

export const runtime = 'edge';

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// Biweekly blog schedule — update this list when new articles are added.
const BLOG_SCHEDULE = [
  { date: "2026-05-12", title: "The Workload Problem: Why Burnout Prevention Programs Don't Work", file: "burnout-programs-dont-work.html", category: "Burnout" },
  { date: "2026-05-26", title: "What Organizational Burnout Recovery Actually Requires", file: "burnout-recovery-organizations.html", category: "Burnout" },
  { date: "2026-06-09", title: "Neuroinclusion Is Not an Accommodation. It's an Architecture Decision.", file: "neuroinclusion-architecture.html", category: "Neuroinclusion" },
  { date: "2026-06-23", title: "Compassion Fatigue Is Not Burnout. Treating Them the Same Makes Both Worse.", file: "compassion-fatigue-vs-burnout.html", category: "Burnout" },
  { date: "2026-07-14", title: "DEI Theater vs. DEI Infrastructure: Why Most Organizations Get Stuck at Performative", file: "dei-theater.html", category: "DEI" },
  { date: "2026-07-28", title: "Pay Equity Is Not a Compensation Problem. It Is a Power Problem.", file: "equity-compensation-strategy.html", category: "Organizational Equity" },
  { date: "2026-08-11", title: "Supervision Quality Is the Single Strongest Predictor of Retention. Are You Measuring It?", file: "supervision-quality-retention.html", category: "Leadership" },
];

const DAYS_BEFORE_NOTIFY = 5;

function todayET(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function sendNotification(article: typeof BLOG_SCHEDULE[0], publishDate: string, daysAway: number): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL ?? "wholisticvibeswellness@gmail.com";
  const from = process.env.RESEND_FROM_EMAIL ?? "WVW Academy <noreply@wvwacademy.com>";
  if (!apiKey) return;

  const formattedDate = new Date(publishDate + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const subject = `📝 Blog article going live in ${daysAway} days — action needed`;

  const html = `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#F5F0E8;border-radius:12px;">
  <p style="margin:0 0 4px;font-size:12px;color:#8a7f75;letter-spacing:0.08em;text-transform:uppercase;">WVW Academy · Blog Schedule</p>
  <h2 style="margin:0 0 20px;font-size:22px;color:#1A1714;line-height:1.3;">Your next article goes live in ${daysAway} days</h2>

  <div style="background:#fff;border:1px solid #DDD7CD;border-radius:8px;padding:20px;margin-bottom:20px;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#C4973A;">${article.category}</p>
    <p style="margin:0 0 8px;font-size:18px;font-weight:500;color:#1A1714;line-height:1.35;">${article.title}</p>
    <p style="margin:0;font-size:13px;color:#8a7f75;">Scheduled: <strong style="color:#1C3A2A;">${formattedDate}</strong></p>
  </div>

  <p style="margin:0 0 12px;font-size:15px;color:#3D3935;line-height:1.6;"><strong>Before it goes live, please:</strong></p>
  <ol style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#3D3935;line-height:1.8;">
    <li>Review the article file: <code style="background:#E8E3DA;padding:2px 6px;border-radius:3px;font-size:13px;">/blog/${article.file}</code></li>
    <li>Update <code style="background:#E8E3DA;padding:2px 6px;border-radius:3px;font-size:13px;">blog/index.html</code> — change the card from "Coming Soon" to active with a read link</li>
    <li>Deploy to Netlify so the article is live on ${formattedDate}</li>
  </ol>

  <hr style="border:none;border-top:1px solid #DDD7CD;margin:20px 0;">
  <p style="margin:0;font-size:12px;color:#8a7f75;">WVW Command Center · <a href="https://wvw-dashboard.vercel.app" style="color:#1C3A2A;text-decoration:none;">Open dashboard</a></p>
</div>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const today = todayET();
  const notifyOn = BLOG_SCHEDULE.map(article => ({
    article,
    triggerDate: addDays(article.date, -DAYS_BEFORE_NOTIFY),
    publishDate: article.date,
    daysAway: DAYS_BEFORE_NOTIFY,
  }));

  const toNotify = notifyOn.filter(({ triggerDate }) => triggerDate === today);

  if (toNotify.length === 0) {
    return Response.json({ sent: 0, today, message: "No notifications needed today." });
  }

  const results = await Promise.allSettled(
    toNotify.map(({ article, publishDate, daysAway }) =>
      sendNotification(article, publishDate, daysAway)
    )
  );

  const sent = results.filter(r => r.status === "fulfilled").length;
  const failed = results.filter(r => r.status === "rejected").length;

  return Response.json({
    sent,
    failed,
    today,
    articles: toNotify.map(({ article }) => article.title),
  });
}
