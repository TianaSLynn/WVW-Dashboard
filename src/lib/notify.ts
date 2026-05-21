// Sends a post-run summary email via Resend.
// Requires: RESEND_API_KEY and NOTIFY_EMAIL in Vercel env vars.
// Sign up free at resend.com → add API key → verify wvwacademy.com domain.

const FROM = process.env.RESEND_FROM_EMAIL ?? "WVW Dashboard <noreply@wvwacademy.com>";

interface RunResult {
  status: string;
  error?: string;
}

export async function sendCronSummary(
  label: string,
  theme: string,
  results: Record<string, RunResult>
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!apiKey || !to) return;

  const posted = Object.entries(results).filter(([, r]) => r.status === "posted");
  const failed = Object.entries(results).filter(([, r]) => r.status === "error");
  const skipped = Object.entries(results).filter(([, r]) => r.status === "skipped");

  const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago", timeZoneName: "short" });

  const postedHtml = posted.length
    ? `<p style="margin:0 0 8px;color:#1C3A2A;font-weight:600;">✓ Posted (${posted.length})</p><ul style="margin:0 0 16px;padding-left:20px;">${posted.map(([p]) => `<li style="margin:2px 0;">${p.replace(/_/g, " ")}</li>`).join("")}</ul>`
    : "";

  const failedHtml = failed.length
    ? `<p style="margin:0 0 8px;color:#C4625A;font-weight:600;">✗ Failed (${failed.length})</p><ul style="margin:0 0 16px;padding-left:20px;">${failed.map(([p, r]) => `<li style="margin:2px 0;"><b>${p.replace(/_/g, " ")}</b>: ${r.error ?? "unknown error"}</li>`).join("")}</ul>`
    : "";

  const skippedHtml = skipped.length
    ? `<p style="margin:0 0 8px;color:#8a7f75;font-weight:600;">— Skipped (${skipped.length})</p><ul style="margin:0 0 16px;padding-left:20px;">${skipped.map(([p, r]) => `<li style="margin:2px 0;">${p.replace(/_/g, " ")}: ${r.error ?? "not configured"}</li>`).join("")}</ul>`
    : "";

  const subject = posted.length
    ? `✓ WVW posted ${posted.length} platform${posted.length !== 1 ? "s" : ""} · ${label}`
    : failed.length
    ? `✗ WVW posting failed · ${label}`
    : `WVW cron ran · ${label} (nothing posted)`;

  const html = `
<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#F5F0E8;border-radius:16px;">
  <p style="margin:0 0 4px;font-size:13px;color:#8a7f75;">${time}</p>
  <h2 style="margin:0 0 4px;font-size:22px;color:#1A1714;">${label}</h2>
  <p style="margin:0 0 24px;font-size:14px;color:#3D3935;">Theme: <em>${theme}</em></p>
  ${postedHtml}${failedHtml}${skippedHtml}
  <hr style="border:none;border-top:1px solid #DDD7CD;margin:20px 0;">
  <p style="margin:0;font-size:12px;color:#8a7f75;">WVW Command Center · <a href="https://wvw-dashboard.vercel.app" style="color:#1C3A2A;">Open dashboard</a></p>
</div>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
}
