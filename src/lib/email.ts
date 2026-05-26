import { Resend } from "resend";

const FROM = "WVW Dashboard <morning@wvwacademy.com>";

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  return new Resend(key);
}

export async function sendMorningEmail(data: {
  dayName: string;
  date: string;
  weather: string;
  wisdom: string;
  blackFact: string;
  song: string;
  focus: string;
  tasks: { title: string; priority: string }[];
  overdue: string[];
  signoff: string;
}): Promise<string> {
  const to = process.env.NOTIFY_EMAIL ?? "tiana@wholisticvibeswellness.com";

  const priorityColor: Record<string, string> = {
    high: "#C4625A",
    medium: "#B8A06A",
    low: "#4A5E4F",
  };

  const taskRows = data.tasks.map((t, i) =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #EDE8DF;">
        <span style="font-size:13px;font-weight:600;color:${priorityColor[t.priority] ?? "#3D3935"};margin-right:8px;">${i + 1}.</span>
        <span style="font-size:14px;color:#1A1714;">${t.title}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #EDE8DF;text-align:right;">
        <span style="font-size:11px;padding:3px 8px;border-radius:20px;background:${priorityColor[t.priority] ?? "#EDE8DF"}22;color:${priorityColor[t.priority] ?? "#3D3935"};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${t.priority}</span>
      </td>
    </tr>`
  ).join("");

  const overdueHtml = data.overdue.length
    ? `<div style="margin:24px 0;padding:16px 20px;background:#FEF3F2;border-radius:12px;border-left:4px solid #C4625A;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#C4625A;text-transform:uppercase;letter-spacing:1px;">⚠ Overdue</p>
        ${data.overdue.map(t => `<p style="margin:4px 0;font-size:14px;color:#1A1714;">${t}</p>`).join("")}
      </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Morning Briefing</title></head>
<body style="margin:0;padding:0;background:#F0EBE1;font-family:'Georgia',serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBE1;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:580px;" cellpadding="0" cellspacing="0">

  <!-- Header -->
  <tr><td style="background:#1C3A2A;border-radius:20px 20px 0 0;padding:36px 36px 28px;text-align:center;">
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#B8A06A;">Wholistic Vibes Wellness</p>
    <h1 style="margin:0 0 8px;font-size:32px;font-weight:400;color:#F5F0E8;letter-spacing:-0.5px;">Good Morning, Queen</h1>
    <p style="margin:0;font-size:15px;color:#8FAF97;">${data.dayName} · ${data.date}${data.weather ? ` · ${data.weather}` : ""}</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#F5F0E8;padding:0 36px 36px;">

    ${data.wisdom ? `
    <!-- Wisdom -->
    <div style="margin:28px 0 0;padding:24px;background:#1A1714;border-radius:16px;text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#B8A06A;">Today's Wisdom</p>
      <p style="margin:0;font-size:16px;font-style:italic;color:#F5F0E8;line-height:1.6;">"${data.wisdom}"</p>
    </div>` : ""}

    ${data.blackFact ? `
    <!-- Black Excellence -->
    <div style="margin:16px 0 0;padding:20px 24px;background:#EDE8DF;border-radius:12px;border-left:4px solid #B8A06A;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A5E4F;">✊🏾 Black Excellence</p>
      <p style="margin:0;font-size:14px;color:#1A1714;line-height:1.6;">${data.blackFact}</p>
    </div>` : ""}

    ${data.song ? `
    <!-- Song -->
    <div style="margin:16px 0 0;padding:16px 24px;background:#EDE8DF;border-radius:12px;display:flex;align-items:center;">
      <p style="margin:0;font-size:14px;color:#1A1714;">🎵 <strong>Start your day with:</strong> ${data.song}</p>
    </div>` : ""}

    ${data.focus ? `
    <!-- Weekly Focus -->
    <div style="margin:24px 0 0;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A5E4F;">🎯 This Week's Focus</p>
      <p style="margin:0;font-size:15px;color:#1A1714;font-weight:600;">${data.focus}</p>
    </div>` : ""}

    ${data.tasks.length ? `
    <!-- Tasks -->
    <div style="margin:24px 0 0;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A5E4F;">📋 Today's Priorities</p>
      <table width="100%" cellpadding="0" cellspacing="0">${taskRows}</table>
    </div>` : ""}

    ${overdueHtml}

    <!-- Sign off -->
    <div style="margin:32px 0 0;padding:24px;background:#1C3A2A22;border-radius:12px;text-align:center;border:1px solid #1C3A2A33;">
      <p style="margin:0;font-size:15px;font-style:italic;color:#1C3A2A;">${data.signoff}</p>
    </div>

  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#1A1714;border-radius:0 0 20px 20px;padding:20px 36px;text-align:center;">
    <p style="margin:0 0 4px;font-size:12px;color:#8a7f75;">WVW Intelligence Platform</p>
    <a href="https://wvw-dashboard.vercel.app" style="font-size:12px;color:#B8A06A;text-decoration:none;">Open Dashboard →</a>
  </td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;

  const resend = client();
  const { data: result, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `☀️ Morning Briefing · ${data.dayName}, ${data.date}`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return result?.id ?? "sent";
}

export async function sendEveningEmail(data: {
  dayName: string;
  date: string;
  rose: string;
  thorn: string;
  closedToday: string[];
  openTasks: string[];
  overdue: string[];
  focusTomorrow: string;
  prompt: string;
}): Promise<string> {
  const to = process.env.NOTIFY_EMAIL ?? "tiana@wholisticvibeswellness.com";

  const closedHtml = data.closedToday.length
    ? data.closedToday.map(t => `<tr><td style="padding:8px 0;border-bottom:1px solid #EDE8DF;font-size:14px;color:#1A1714;">✅ ${t}</td></tr>`).join("")
    : `<tr><td style="padding:8px 0;font-size:14px;color:#8a7f75;font-style:italic;">No tasks completed today — tomorrow is a fresh start.</td></tr>`;

  const openHtml = data.openTasks.length
    ? data.openTasks.map(t => `<tr><td style="padding:8px 0;border-bottom:1px solid #EDE8DF;font-size:14px;color:#1A1714;">📌 ${t}</td></tr>`).join("")
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Evening Check-In</title></head>
<body style="margin:0;padding:0;background:#1A1714;font-family:'Georgia',serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1714;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:580px;" cellpadding="0" cellspacing="0">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#1C2A3A 0%,#2A1C3A 100%);border-radius:20px 20px 0 0;padding:36px 36px 28px;text-align:center;">
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#B8A06A;">Wholistic Vibes Wellness</p>
    <h1 style="margin:0 0 8px;font-size:32px;font-weight:400;color:#F5F0E8;letter-spacing:-0.5px;">Evening Check-In 🌙</h1>
    <p style="margin:0;font-size:15px;color:#8a9fbf;">${data.dayName} · ${data.date}</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#F5F0E8;padding:0 36px 36px;">

    <!-- Rose & Thorn -->
    <div style="margin:28px 0 0;display:flex;gap:16px;">

      <div style="flex:1;padding:20px;background:#FFF8F6;border-radius:12px;border-left:4px solid #C4A09A;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C4625A;">🌹 Rose</p>
        <p style="margin:0;font-size:14px;color:#1A1714;line-height:1.6;font-style:italic;">${data.rose || "You showed up. That counts."}</p>
      </div>

    </div>
    <div style="margin:12px 0 0;padding:20px;background:#F6FFF8;border-radius:12px;border-left:4px solid #4A5E4F;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A5E4F;">🌵 Thorn</p>
      <p style="margin:0;font-size:14px;color:#1A1714;line-height:1.6;font-style:italic;">${data.thorn || "Something to carry forward with grace."}</p>
    </div>

    <!-- Completed -->
    <div style="margin:24px 0 0;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A5E4F;">Done Today</p>
      <table width="100%" cellpadding="0" cellspacing="0">${closedHtml}</table>
    </div>

    ${openHtml ? `
    <!-- Open -->
    <div style="margin:24px 0 0;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#3D3935;">Still Open</p>
      <table width="100%" cellpadding="0" cellspacing="0">${openHtml}</table>
    </div>` : ""}

    ${data.overdue.length ? `
    <div style="margin:16px 0 0;padding:16px 20px;background:#FEF3F2;border-radius:12px;border-left:4px solid #C4625A;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#C4625A;text-transform:uppercase;">⚠ Overdue</p>
      ${data.overdue.map(t => `<p style="margin:4px 0;font-size:14px;color:#1A1714;">${t}</p>`).join("")}
    </div>` : ""}

    ${data.focusTomorrow ? `
    <!-- Tomorrow -->
    <div style="margin:24px 0 0;padding:20px 24px;background:#1C3A2A;border-radius:12px;text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#B8A06A;">🎯 Tomorrow's Focus</p>
      <p style="margin:0;font-size:16px;color:#F5F0E8;font-weight:600;">${data.focusTomorrow}</p>
    </div>` : ""}

    <!-- Reflection prompt -->
    <div style="margin:24px 0 0;padding:20px;background:#EDE8DF;border-radius:12px;text-align:center;">
      <p style="margin:0;font-size:14px;font-style:italic;color:#3D3935;">${data.prompt}</p>
    </div>

    <p style="margin:24px 0 0;text-align:center;font-size:15px;font-style:italic;color:#4A5E4F;">Rest well. 🌿</p>

  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#1A1714;border-radius:0 0 20px 20px;padding:20px 36px;text-align:center;">
    <p style="margin:0 0 4px;font-size:12px;color:#8a7f75;">WVW Intelligence Platform</p>
    <a href="https://wvw-dashboard.vercel.app" style="font-size:12px;color:#B8A06A;text-decoration:none;">Open Dashboard →</a>
  </td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;

  const resend = client();
  const { data: result, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `🌙 Evening Check-In · ${data.dayName}`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return result?.id ?? "sent";
}
