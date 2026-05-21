import { NextRequest } from "next/server";

export const maxDuration = 60;

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// Monthly newsletter topics — one per month, loosely aligned with blog themes.
// Update as needed; this drives the newsletter outline sent for review.
const MONTHLY_TOPICS: Record<string, { theme: string; blogTie: string; suggestedSubject: string }> = {
  "2026-06": {
    theme: "Organizational Burnout Recovery",
    blogTie: "Burnout Recovery Organizations + Compassion Fatigue articles",
    suggestedSubject: "What organizations owe burned-out teams (and what won't fix it)",
  },
  "2026-07": {
    theme: "Beyond DEI Theater",
    blogTie: "DEI Theater vs. Infrastructure article",
    suggestedSubject: "The difference between DEI signaling and DEI infrastructure",
  },
  "2026-08": {
    theme: "Pay Equity & Supervision Quality",
    blogTie: "Equity Compensation + Supervision Quality articles",
    suggestedSubject: "Two things organizations measure wrong — and why it shows up in your retention data",
  },
};

// Runs on the 20th of each month. Checks what newsletter is due the following month
// and sends Tiána an email with a suggested outline + action checklist.
export async function GET(req: NextRequest) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL ?? "wholisticvibeswellness@gmail.com";
  const from = process.env.RESEND_FROM_EMAIL ?? "WVW Academy <noreply@wvwacademy.com>";
  const beehiivPubId = process.env.BEEHIIV_PUBLICATION_ID;

  if (!apiKey) return Response.json({ error: "RESEND_API_KEY not configured" }, { status: 503 });

  // Figure out next month (newsletter is sent the 1st of next month)
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;
  const nextMonthName = nextMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const publishDate = nextMonth.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const topic = MONTHLY_TOPICS[nextMonthKey];
  const beehiivLink = "https://app.beehiiv.com/posts/new";
  const archiveLink = "https://tinas-newsletter-e16d75.beehiiv.com/";

  const themeSection = topic
    ? `
  <div style="background:#fff;border:1px solid #DDD7CD;border-radius:8px;padding:20px;margin-bottom:20px;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#C4973A;">Suggested Theme</p>
    <p style="margin:0 0 8px;font-size:18px;font-weight:500;color:#1A1714;line-height:1.35;">${topic.theme}</p>
    <p style="margin:0 0 6px;font-size:14px;color:#3D3935;"><strong>Ties to:</strong> ${topic.blogTie}</p>
    <p style="margin:0;font-size:14px;color:#3D3935;"><strong>Suggested subject line:</strong><br><em>"${topic.suggestedSubject}"</em></p>
  </div>`
    : `
  <div style="background:#fff;border:1px solid #DDD7CD;border-radius:8px;padding:20px;margin-bottom:20px;">
    <p style="margin:0;font-size:14px;color:#3D3935;">No pre-planned theme for ${nextMonthName}. Write about what feels most timely — or pull from your recent client conversations for inspiration.</p>
  </div>`;

  const subject = `📬 ${nextMonthName} newsletter — draft it this week`;

  const html = `
<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#F5F0E8;border-radius:12px;">
  <p style="margin:0 0 4px;font-size:12px;color:#8a7f75;letter-spacing:0.08em;text-transform:uppercase;">WVW Academy · Monthly Newsletter</p>
  <h2 style="margin:0 0 6px;font-size:22px;color:#1A1714;line-height:1.3;">Time to draft the ${nextMonthName} newsletter</h2>
  <p style="margin:0 0 20px;font-size:14px;color:#8a7f75;">Target send date: <strong style="color:#1C3A2A;">${publishDate}</strong></p>

  ${themeSection}

  <p style="margin:0 0 12px;font-size:15px;color:#3D3935;line-height:1.6;"><strong>Suggested newsletter structure:</strong></p>
  <ol style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#3D3935;line-height:1.9;">
    <li><strong>Opening — 2-3 sentences:</strong> What you've been thinking about lately. Personal, grounded.</li>
    <li><strong>Main insight — 3-4 paragraphs:</strong> One idea from your practice or the month's blog content. Not a summary — your take.</li>
    <li><strong>The question to sit with:</strong> One prompt your reader can bring back to their own organization.</li>
    <li><strong>Link to the blog:</strong> Direct to the most relevant article from this month.</li>
    <li><strong>Close + CTA:</strong> Discovery call or reply-to-connect invitation.</li>
  </ol>

  <p style="margin:0 0 16px;font-size:14px;color:#3D3935;line-height:1.7;">Target length: <strong>400–600 words</strong>. Personal and substantive — not a round-up, not a pitch.</p>

  <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
    <a href="${beehiivLink}" style="display:inline-block;background:#1C3A2A;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:13px;font-weight:600;">Create draft in Beehiiv →</a>
    <a href="${archiveLink}" style="display:inline-block;background:#fff;border:1px solid #DDD7CD;color:#1C3A2A;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:13px;font-weight:600;">View past issues</a>
  </div>

  <hr style="border:none;border-top:1px solid #DDD7CD;margin:20px 0;">
  <p style="margin:0;font-size:12px;color:#8a7f75;">WVW Command Center · <a href="https://wvw-dashboard.vercel.app" style="color:#1C3A2A;text-decoration:none;">Open dashboard</a>${beehiivPubId ? ` · <a href="https://app.beehiiv.com" style="color:#1C3A2A;text-decoration:none;">Beehiiv dashboard</a>` : ""}</p>
</div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: "Email send failed", detail: err }, { status: 500 });
  }

  return Response.json({ sent: true, to, nextMonth: nextMonthKey, topic: topic?.theme ?? "custom" });
}
