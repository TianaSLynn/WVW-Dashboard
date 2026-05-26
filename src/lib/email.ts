import { Resend } from "resend";
import type { DailyBrief, EveningBrief } from "./daily-brief";

const FROM = "WVW Dashboard <morning@wvwacademy.com>";

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  return new Resend(key);
}

function nl2br(text: string): string {
  return text.replace(/\n/g, "<br>");
}

function postBox(platform: string, content: string, bg: string, accent: string): string {
  return `
    <div style="margin:16px 0 0;border-radius:12px;overflow:hidden;border:1px solid ${accent}44;">
      <div style="background:${accent};padding:10px 18px;">
        <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#F5F0E8;font-weight:700;">${platform} — Ready to Paste</p>
      </div>
      <div style="background:${bg};padding:18px 20px;">
        <p style="margin:0;font-size:13px;color:#E8E3DA;line-height:1.7;white-space:pre-wrap;font-family:Georgia,serif;">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
      </div>
    </div>`;
}

function sectionHeader(label: string, color = "#4A5E4F"): string {
  return `<p style="margin:0 0 12px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${color};font-weight:700;">${label}</p>`;
}

export async function sendMorningEmail(data: {
  dayName: string;
  date: string;
  weather: string;
  wisdom: string;
  blackFact: string;
  song: string;
  focus: string;
  wordOfWeek?: string;
  intentions?: string[];
  habits?: string[];
  tasks: { title: string; priority: string }[];
  overdue: string[];
  signoff: string;
  dailyBrief?: DailyBrief;
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
        <span style="font-size:11px;padding:3px 8px;border-radius:20px;background:${priorityColor[t.priority] ?? "#EDE8DF"}22;color:${priorityColor[t.priority] ?? "#3D3935"};font-weight:600;text-transform:uppercase;">${t.priority}</span>
      </td>
    </tr>`
  ).join("");

  const overdueHtml = data.overdue.length
    ? `<div style="margin:24px 0 0;padding:16px 20px;background:#FEF3F2;border-radius:12px;border-left:4px solid #C4625A;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#C4625A;text-transform:uppercase;">⚠ Overdue</p>
        ${data.overdue.map(t => `<p style="margin:4px 0;font-size:14px;color:#1A1714;">${t}</p>`).join("")}
      </div>`
    : "";

  const db = data.dailyBrief;

  const dailyBriefHtml = db ? `

    <!-- DIVIDER -->
    <div style="margin:36px 0 32px;border-top:2px solid #1C3A2A;"></div>
    <p style="margin:0 0 28px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#B8A06A;text-align:center;font-weight:700;">✦ Daily Intelligence Brief ✦</p>

    <!-- VIBE + WVW VALUES -->
    <div style="margin:0 0 24px;background:#1C3A2A;border-radius:16px;padding:28px 24px;">
      ${sectionHeader("Today's Vibe", "#B8A06A")}
      <p style="margin:0 0 16px;font-size:18px;font-style:italic;color:#F5F0E8;line-height:1.5;">"${db.vibe_line}"</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right:16px;vertical-align:top;width:50%;">
            <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8FAF97;">Word of the Day</p>
            <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#B8A06A;letter-spacing:2px;text-transform:uppercase;">${db.word_of_day}</p>
          </td>
          <td style="vertical-align:top;width:50%;">
            <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8FAF97;">Energy to Protect</p>
            <p style="margin:0 0 16px;font-size:13px;color:#F5F0E8;line-height:1.5;">${db.energy_to_protect}</p>
          </td>
        </tr>
      </table>
      <div style="border-top:1px solid #2A5A3A;padding-top:16px;margin-top:4px;">
        <table width="100%" cellpadding="0" cellspacing="8">
          <tr><td style="padding-bottom:10px;"><p style="margin:0 0 2px;font-size:10px;color:#8FAF97;text-transform:uppercase;letter-spacing:1px;">Psychological Safety</p><p style="margin:0;font-size:13px;color:#E8E3DA;line-height:1.5;">${db.ps_action}</p></td></tr>
          <tr><td style="padding-bottom:10px;"><p style="margin:0 0 2px;font-size:10px;color:#8FAF97;text-transform:uppercase;letter-spacing:1px;">Systems &amp; Power Awareness</p><p style="margin:0;font-size:13px;color:#E8E3DA;line-height:1.5;">${db.spa_action}</p></td></tr>
          <tr><td><p style="margin:0 0 2px;font-size:10px;color:#8FAF97;text-transform:uppercase;letter-spacing:1px;">Lived Experience as Expertise</p><p style="margin:0;font-size:13px;color:#E8E3DA;line-height:1.5;">${db.lxe_action}</p></td></tr>
        </table>
      </div>
      <div style="border-top:1px solid #2A5A3A;padding-top:16px;margin-top:16px;">
        <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B8A06A;">Code I Live By Today</p>
        <p style="margin:0;font-size:14px;font-style:italic;color:#F5F0E8;line-height:1.6;">${db.code_today}</p>
      </div>
    </div>

    <!-- HOROSCOPE -->
    <div style="margin:0 0 24px;background:#1C2A3A;border-radius:16px;padding:24px;">
      ${sectionHeader("Astro Focus — Capricorn", "#8FA8C8")}
      <p style="margin:0 0 8px;font-size:14px;color:#D8E8F8;line-height:1.6;"><strong style="color:#B8A06A;">Theme:</strong> ${db.astro_theme}</p>
      <p style="margin:0 0 8px;font-size:14px;color:#D8E8F8;line-height:1.6;"><strong style="color:#B8A06A;">Emotional Weather:</strong> ${db.astro_emotional_weather}</p>
      <p style="margin:0 0 8px;font-size:14px;color:#D8E8F8;line-height:1.6;">⚡ <strong>Power Move:</strong> ${db.astro_power_move}</p>
      <p style="margin:0 0 12px;font-size:14px;color:#D8E8F8;line-height:1.6;">🛑 <strong>Avoid:</strong> ${db.astro_avoid}</p>
      <div style="background:#22384A;border-radius:8px;padding:14px 16px;">
        <p style="margin:0;font-size:14px;font-style:italic;color:#F5F0E8;line-height:1.6;">"${db.astro_affirmation}"</p>
      </div>
    </div>

    <!-- HERB -->
    <div style="margin:0 0 24px;background:#EDE8DF;border-radius:16px;padding:24px;">
      ${sectionHeader("Herb + Ritual")}
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:50%;padding-right:12px;vertical-align:top;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1A1714;">🌿 ${db.herb_primary}</p>
            <p style="margin:0 0 4px;font-size:12px;color:#4A5E4F;">${db.herb_primary_why}</p>
            <p style="margin:0;font-size:12px;font-style:italic;color:#3D3935;">${db.herb_primary_how}</p>
          </td>
          <td style="width:50%;vertical-align:top;padding-left:12px;border-left:1px solid #DDD7CD;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1A1714;">✦ ${db.herb_supporting}</p>
            <p style="margin:0 0 4px;font-size:12px;color:#4A5E4F;">${db.herb_supporting_why}</p>
            <p style="margin:0;font-size:12px;font-style:italic;color:#3D3935;">${db.herb_supporting_how}</p>
          </td>
        </tr>
      </table>
      <p style="margin:12px 0 0;font-size:11px;color:#8a7f75;border-top:1px solid #DDD7CD;padding-top:10px;">⚠ ${db.herb_safety}</p>
    </div>

    <!-- WORKOUT -->
    <div style="margin:0 0 24px;background:#1A1714;border-radius:16px;padding:24px;">
      ${sectionHeader("Today's Workout — " + db.workout_focus, "#B8A06A")}
      <p style="margin:0 0 16px;font-size:12px;color:#8a7f75;text-transform:uppercase;letter-spacing:1px;">${db.workout_theme}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:0 0 16px;vertical-align:top;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#B8A06A;text-transform:uppercase;letter-spacing:1px;">Warmup (4–6 min)</p>
            <p style="margin:0;font-size:13px;color:#E8E3DA;line-height:1.7;">${nl2br(db.workout_warmup)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-top:1px solid #333;vertical-align:top;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#4A9E6F;text-transform:uppercase;letter-spacing:1px;">Beginner Option</p>
            <p style="margin:0;font-size:13px;color:#E8E3DA;line-height:1.7;">${nl2br(db.workout_beginner)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-top:1px solid #333;vertical-align:top;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#C4625A;text-transform:uppercase;letter-spacing:1px;">Level-Up Option</p>
            <p style="margin:0;font-size:13px;color:#E8E3DA;line-height:1.7;">${nl2br(db.workout_levelup)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-top:1px solid #333;vertical-align:top;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#8FA8C8;text-transform:uppercase;letter-spacing:1px;">Cooldown (4–6 min)</p>
            <p style="margin:0;font-size:13px;color:#E8E3DA;line-height:1.7;">${nl2br(db.workout_cooldown)}</p>
          </td>
        </tr>
      </table>
      <div style="margin:16px 0 0;background:#2A2420;border-radius:8px;padding:12px 16px;">
        <p style="margin:0;font-size:12px;color:#B8A06A;">🏆 <strong>Win Condition:</strong> ${db.workout_win_condition}</p>
      </div>
    </div>

    <!-- SOCIAL POSTS -->
    <div style="margin:0 0 24px;">
      ${sectionHeader("Ready-to-Post Content")}
      ${postBox("LinkedIn Personal — Tiána Lynn", db.linkedin_personal, "#1C2433", "#0A66C2")}
      ${postBox("LinkedIn WVW Page", db.linkedin_wvw, "#1C2433", "#1C3A2A")}
      ${postBox("Facebook", db.facebook, "#1C2433", "#3B5998")}
    </div>

    <!-- BLACK EXCELLENCE -->
    <div style="margin:0 0 24px;background:#2A1C14;border-radius:16px;padding:24px;">
      ${sectionHeader("Black Excellence Spotlight", "#B8A06A")}
      <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#F5F0E8;">${db.be_name}</p>
      <p style="margin:0 0 16px;font-size:13px;color:#C4A070;font-style:italic;">${db.be_who}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:33%;padding-right:12px;vertical-align:top;">
            <p style="margin:0 0 6px;font-size:10px;color:#B8A06A;text-transform:uppercase;letter-spacing:1px;font-weight:700;">What They Did</p>
            ${(db.be_what ?? []).map(b => `<p style="margin:0 0 6px;font-size:12px;color:#E8D8C0;line-height:1.5;">• ${b}</p>`).join("")}
          </td>
          <td style="width:33%;padding:0 8px;vertical-align:top;border-left:1px solid #3A2A1A;">
            <p style="margin:0 0 6px;font-size:10px;color:#B8A06A;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Why It Matters</p>
            ${(db.be_why ?? []).map(b => `<p style="margin:0 0 6px;font-size:12px;color:#E8D8C0;line-height:1.5;">• ${b}</p>`).join("")}
          </td>
          <td style="width:33%;padding-left:12px;vertical-align:top;border-left:1px solid #3A2A1A;">
            <p style="margin:0 0 6px;font-size:10px;color:#B8A06A;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Mirrors My Path</p>
            ${(db.be_mirrors ?? []).map(b => `<p style="margin:0 0 6px;font-size:12px;color:#E8D8C0;line-height:1.5;">• ${b}</p>`).join("")}
          </td>
        </tr>
      </table>
      <div style="margin:16px 0 0;padding:14px 16px;background:#1A1008;border-radius:8px;border-left:3px solid #B8A06A;">
        <p style="margin:0;font-size:13px;font-style:italic;color:#E8D8C0;line-height:1.6;">"${db.be_quote}"</p>
      </div>
    </div>

    <!-- PROMPTS -->
    <div style="margin:0 0 24px;background:#EDE8DF;border-radius:16px;padding:24px;">
      ${sectionHeader("Mini Daily Prompts")}
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-bottom:12px;vertical-align:top;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#C4625A;text-transform:uppercase;letter-spacing:1px;">Personal Healing</p>
            <p style="margin:0;font-size:13px;color:#1A1714;line-height:1.6;font-style:italic;">${db.prompt_healing}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-top:1px solid #DDD7CD;vertical-align:top;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#1C3A2A;text-transform:uppercase;letter-spacing:1px;">CEO / Operations</p>
            <p style="margin:0;font-size:13px;color:#1A1714;line-height:1.6;font-style:italic;">${db.prompt_ceo}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0 0;border-top:1px solid #DDD7CD;vertical-align:top;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#7C3AED;text-transform:uppercase;letter-spacing:1px;">Creative / Spoken-Word</p>
            <p style="margin:0;font-size:13px;color:#1A1714;line-height:1.6;font-style:italic;">${db.prompt_creative}</p>
          </td>
        </tr>
      </table>
      <div style="margin:16px 0 0;background:#1C3A2A;border-radius:8px;padding:12px 16px;">
        <p style="margin:0;font-size:12px;color:#F5F0E8;">⚡ <strong>1-Minute Embodiment:</strong> ${db.embodiment_action}</p>
      </div>
    </div>

    <!-- ROOM WORDS -->
    <div style="margin:0 0 0;">
      ${sectionHeader("Room Readiness — Words for the Rooms You Enter")}
      <table width="100%" cellpadding="0" cellspacing="0">
        ${(db.room_words ?? []).map((w, i) => `
        <tr>
          <td style="padding:${i === 0 ? "0" : "16px"} 0 16px;${i > 0 ? "border-top:1px solid #DDD7CD;" : ""}vertical-align:top;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:top;padding-right:12px;width:40%;">
                  <p style="margin:0 0 2px;font-size:20px;font-weight:700;color:#1C3A2A;">${w.word}</p>
                  <p style="margin:0 0 6px;font-size:10px;color:#B8A06A;text-transform:uppercase;letter-spacing:1px;">${w.room}</p>
                  <p style="margin:0;font-size:12px;color:#4A5E4F;line-height:1.5;">${w.definition}</p>
                </td>
                <td style="vertical-align:top;padding-left:12px;border-left:2px solid #1C3A2A22;width:60%;">
                  <p style="margin:0 0 6px;font-size:12px;color:#3D3935;line-height:1.5;"><strong>In the room:</strong> ${w.room_use}</p>
                  <p style="margin:0 0 6px;font-size:12px;color:#1C3A2A;line-height:1.5;font-weight:600;"><strong>My use:</strong> ${w.my_use}</p>
                  ${w.caution ? `<p style="margin:0;font-size:11px;color:#C4625A;line-height:1.5;">⚠ ${w.caution}</p>` : ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>`).join("")}
      </table>
    </div>

  ` : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Morning Briefing</title></head>
<body style="margin:0;padding:0;background:#F0EBE1;font-family:'Georgia',serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBE1;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">

  <!-- Header -->
  <tr><td style="background:#1C3A2A;border-radius:20px 20px 0 0;padding:36px 36px 28px;text-align:center;">
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#B8A06A;">Wholistic Vibes Wellness</p>
    <h1 style="margin:0 0 8px;font-size:32px;font-weight:400;color:#F5F0E8;letter-spacing:-0.5px;">Good Morning, Queen</h1>
    <p style="margin:0;font-size:15px;color:#8FAF97;">${data.dayName} · ${data.date}${data.weather ? ` · ${data.weather}` : ""}</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#F5F0E8;padding:0 36px 36px;">

    ${data.wisdom ? `
    <div style="margin:28px 0 0;padding:24px;background:#1A1714;border-radius:16px;text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#B8A06A;">Today's Wisdom</p>
      <p style="margin:0;font-size:16px;font-style:italic;color:#F5F0E8;line-height:1.6;">"${data.wisdom}"</p>
    </div>` : ""}

    ${data.blackFact ? `
    <div style="margin:16px 0 0;padding:20px 24px;background:#EDE8DF;border-radius:12px;border-left:4px solid #B8A06A;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A5E4F;">✊🏾 Black Excellence</p>
      <p style="margin:0;font-size:14px;color:#1A1714;line-height:1.6;">${data.blackFact}</p>
    </div>` : ""}

    ${data.song ? `
    <div style="margin:16px 0 0;padding:16px 24px;background:#EDE8DF;border-radius:12px;">
      <p style="margin:0;font-size:14px;color:#1A1714;">🎵 <strong>Start with:</strong> ${data.song}</p>
    </div>` : ""}

    ${data.wordOfWeek ? `
    <div style="margin:16px 0 0;padding:18px 24px;background:#1C3A2A;border-radius:12px;text-align:center;">
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#B8A06A;">Word of the Week</p>
      <p style="margin:0;font-size:24px;font-weight:700;color:#F5F0E8;letter-spacing:3px;text-transform:uppercase;">${data.wordOfWeek}</p>
    </div>` : ""}

    ${data.intentions && data.intentions.filter(Boolean).length > 0 ? `
    <div style="margin:16px 0 0;">
      <p style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A5E4F;">Today's Top 3</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${data.intentions.filter(Boolean).map((item, i) => `<tr><td style="padding:9px 0;border-bottom:1px solid #EDE8DF;"><span style="font-size:13px;font-weight:700;color:#B8A06A;margin-right:10px;">${i + 1}.</span><span style="font-size:14px;color:#1A1714;">${item}</span></td></tr>`).join("")}
      </table>
    </div>` : ""}

    ${data.focus ? `
    <div style="margin:24px 0 0;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A5E4F;">🎯 This Week's Focus</p>
      <p style="margin:0;font-size:15px;color:#1A1714;font-weight:600;">${data.focus}</p>
    </div>` : ""}

    ${data.habits && data.habits.length > 0 ? `
    <div style="margin:24px 0 0;padding:20px 24px;background:#EDE8DF;border-radius:12px;">
      <p style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A5E4F;">☀️ Morning Habits</p>
      ${data.habits.map(h => `<p style="margin:0 0 7px;font-size:14px;color:#1A1714;">○ ${h}</p>`).join("")}
    </div>` : ""}

    ${data.tasks.length ? `
    <div style="margin:24px 0 0;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A5E4F;">📋 Today's Priorities</p>
      <table width="100%" cellpadding="0" cellspacing="0">${taskRows}</table>
    </div>` : ""}

    ${overdueHtml}

    ${dailyBriefHtml}

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
  energyLevel?: number;
  mood?: string;
  habitSummary?: { name: string; done: boolean }[];
  weeklyProgress?: number;
  closedToday: string[];
  openTasks: string[];
  overdue: string[];
  focusTomorrow: string;
  prompt: string;
  eveningBrief?: EveningBrief;
}): Promise<string> {
  const to = process.env.NOTIFY_EMAIL ?? "tiana@wholisticvibeswellness.com";

  const closedHtml = data.closedToday.length
    ? data.closedToday.map(t => `<tr><td style="padding:8px 0;border-bottom:1px solid #EDE8DF;font-size:14px;color:#1A1714;">✅ ${t}</td></tr>`).join("")
    : `<tr><td style="padding:8px 0;font-size:14px;color:#8a7f75;font-style:italic;">No tasks completed today — tomorrow is a fresh start.</td></tr>`;

  const openHtml = data.openTasks.length
    ? data.openTasks.map(t => `<tr><td style="padding:8px 0;border-bottom:1px solid #EDE8DF;font-size:14px;color:#1A1714;">📌 ${t}</td></tr>`).join("")
    : "";

  const eb = data.eveningBrief;

  const eveningBriefHtml = eb ? `

    <div style="margin:32px 0 28px;border-top:2px solid #2A4A6A;"></div>
    <p style="margin:0 0 28px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#B8A06A;text-align:center;font-weight:700;">✦ Evening Integration ✦</p>

    <!-- Reflection Theme -->
    <div style="margin:0 0 20px;background:#1C2A3A;border-radius:14px;padding:22px;">
      <p style="margin:0 0 6px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8FA8C8;">Tonight's Theme</p>
      <p style="margin:0 0 14px;font-size:16px;font-style:italic;color:#F5F0E8;line-height:1.5;">${eb.reflection_theme}</p>
      <p style="margin:0;font-size:13px;color:#D0DDE8;line-height:1.6;">${eb.energy_integration}</p>
    </div>

    <!-- Body Release + Ritual -->
    <div style="margin:0 0 20px;background:#EDE8DF;border-radius:14px;padding:22px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:50%;padding-right:12px;vertical-align:top;">
            <p style="margin:0 0 6px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#4A5E4F;">Body Release</p>
            <p style="margin:0;font-size:13px;color:#1A1714;line-height:1.5;">${eb.body_release}</p>
          </td>
          <td style="width:50%;padding-left:12px;vertical-align:top;border-left:1px solid #DDD7CD;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1A1714;">🌙 ${eb.ritual_primary}</p>
            <p style="margin:0 0 4px;font-size:12px;color:#4A5E4F;">${eb.ritual_why}</p>
            <p style="margin:0;font-size:12px;font-style:italic;color:#3D3935;">${eb.ritual_how}</p>
          </td>
        </tr>
      </table>
      <div style="margin:14px 0 0;border-top:1px solid #DDD7CD;padding-top:14px;">
        <p style="margin:0 0 6px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#4A5E4F;">Wind-Down Practice</p>
        <p style="margin:0;font-size:13px;color:#1A1714;line-height:1.6;">${eb.wind_down_practice}</p>
      </div>
    </div>

    <!-- Evening Prompts -->
    <div style="margin:0 0 20px;background:#1A1714;border-radius:14px;padding:22px;">
      <p style="margin:0 0 16px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B8A06A;">Evening Reflection Prompts</p>
      <p style="margin:0 0 12px;font-size:13px;color:#E8E3DA;line-height:1.6;"><strong style="color:#C4625A;">Release:</strong> ${eb.prompt_release}</p>
      <p style="margin:0 0 12px;font-size:13px;color:#E8E3DA;line-height:1.6;"><strong style="color:#4A9E6F;">Integration:</strong> ${eb.prompt_integration}</p>
      <p style="margin:0;font-size:13px;color:#E8E3DA;line-height:1.6;"><strong style="color:#B8A06A;">Gratitude:</strong> ${eb.prompt_gratitude}</p>
    </div>

    <!-- Tomorrow's Seed + Closing -->
    <div style="margin:0 0 0;background:#1C3A2A;border-radius:14px;padding:22px;text-align:center;">
      <p style="margin:0 0 8px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8FAF97;">Seed for Tomorrow</p>
      <p style="margin:0 0 16px;font-size:14px;color:#F5F0E8;line-height:1.6;">${eb.tomorrow_seed}</p>
      <div style="border-top:1px solid #2A5A3A;padding-top:16px;">
        <p style="margin:0;font-size:15px;font-style:italic;color:#B8A06A;line-height:1.6;">"${eb.closing_affirmation}"</p>
      </div>
    </div>

  ` : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Evening Check-In</title></head>
<body style="margin:0;padding:0;background:#1A1714;font-family:'Georgia',serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1714;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">

  <!-- Header -->
  <tr><td style="background:#1C2A3A;border-radius:20px 20px 0 0;padding:36px 36px 28px;text-align:center;">
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#B8A06A;">Wholistic Vibes Wellness</p>
    <h1 style="margin:0 0 8px;font-size:32px;font-weight:400;color:#F5F0E8;letter-spacing:-0.5px;">Evening Check-In 🌙</h1>
    <p style="margin:0;font-size:15px;color:#8a9fbf;">${data.dayName} · ${data.date}</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#F5F0E8;padding:0 36px 36px;">

    <!-- Rose & Thorn -->
    <div style="margin:28px 0 0;padding:20px;background:#FFF8F6;border-radius:12px;border-left:4px solid #C4A09A;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C4625A;">🌹 Rose</p>
      <p style="margin:0;font-size:14px;color:#1A1714;line-height:1.6;font-style:italic;">${data.rose || "You showed up. That counts."}</p>
    </div>
    <div style="margin:12px 0 0;padding:20px;background:#F6FFF8;border-radius:12px;border-left:4px solid #4A5E4F;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A5E4F;">🌵 Thorn</p>
      <p style="margin:0;font-size:14px;color:#1A1714;line-height:1.6;font-style:italic;">${data.thorn || "Something to carry forward with grace."}</p>
    </div>

    <!-- How You Showed Up (energy + mood) -->
    ${(data.energyLevel || data.mood) ? `
    <div style="margin:20px 0 0;padding:18px 24px;background:#EDE8DF;border-radius:12px;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A5E4F;">How You Showed Up Today</p>
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        ${data.energyLevel ? `<td style="width:50%;vertical-align:top;padding-right:12px;"><p style="margin:0 0 4px;font-size:11px;color:#8a7f75;">Energy Level</p><p style="margin:0;font-size:18px;letter-spacing:2px;">${"●".repeat(data.energyLevel)}${"○".repeat(5 - data.energyLevel)}</p></td>` : ""}
        ${data.mood ? `<td style="width:50%;vertical-align:top;"><p style="margin:0 0 4px;font-size:11px;color:#8a7f75;">Mood</p><p style="margin:0;font-size:15px;font-weight:600;color:#1A1714;text-transform:capitalize;">${data.mood}</p></td>` : ""}
      </tr></table>
    </div>` : ""}

    <!-- Completed Today -->
    <div style="margin:20px 0 0;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A5E4F;">Done Today</p>
      <table width="100%" cellpadding="0" cellspacing="0">${closedHtml}</table>
    </div>

    <!-- Habit Recap -->
    ${data.habitSummary && data.habitSummary.length > 0 ? `
    <div style="margin:20px 0 0;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A5E4F;">Habit Recap</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${data.habitSummary.map(h => `<tr><td style="padding:8px 0;border-bottom:1px solid #EDE8DF;"><span style="font-size:15px;margin-right:10px;">${h.done ? "✅" : "⬜"}</span><span style="font-size:14px;color:${h.done ? "#1A1714" : "#8a7f75"};">${h.name}</span></td></tr>`).join("")}
      </table>
    </div>` : ""}

    <!-- Weekly Progress -->
    ${data.weeklyProgress !== undefined ? `
    <div style="margin:20px 0 0;padding:18px 24px;background:#EDE8DF;border-radius:12px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A5E4F;">This Week's Momentum</p>
      <div style="background:#DDD7CD;border-radius:6px;height:10px;overflow:hidden;"><div style="background:#1C3A2A;height:10px;width:${Math.min(100, Math.round(data.weeklyProgress))}%;border-radius:6px;"></div></div>
      <p style="margin:8px 0 0;font-size:12px;color:#4A5E4F;font-weight:600;">${Math.round(data.weeklyProgress)}% habits completed this week</p>
    </div>` : ""}

    <!-- Still Open -->
    ${openHtml ? `
    <div style="margin:20px 0 0;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#3D3935;">Still Open</p>
      <table width="100%" cellpadding="0" cellspacing="0">${openHtml}</table>
    </div>` : ""}

    <!-- Overdue -->
    ${data.overdue.length ? `
    <div style="margin:16px 0 0;padding:16px 20px;background:#FEF3F2;border-radius:12px;border-left:4px solid #C4625A;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#C4625A;text-transform:uppercase;">⚠ Overdue</p>
      ${data.overdue.map(t => `<p style="margin:4px 0;font-size:14px;color:#1A1714;">${t}</p>`).join("")}
    </div>` : ""}

    <!-- Tomorrow's Focus -->
    ${data.focusTomorrow ? `
    <div style="margin:20px 0 0;padding:20px 24px;background:#1C3A2A;border-radius:12px;text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#B8A06A;">🎯 Tomorrow's Focus</p>
      <p style="margin:0;font-size:16px;color:#F5F0E8;font-weight:600;">${data.focusTomorrow}</p>
    </div>` : ""}

    <!-- Reflection Prompt -->
    <div style="margin:20px 0 0;padding:20px;background:#EDE8DF;border-radius:12px;text-align:center;">
      <p style="margin:0;font-size:14px;font-style:italic;color:#3D3935;">${data.prompt}</p>
    </div>

    ${eveningBriefHtml}

    <p style="margin:28px 0 0;text-align:center;font-size:15px;font-style:italic;color:#4A5E4F;">Rest well. 🌿</p>

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

export async function sendDeadlineAlert(sections: {
  overdue?: { title: string; due_date: string }[];
  dueToday?: { title: string }[];
  dueTomorrow?: { title: string }[];
  dueSoon?: { title: string; due_date: string }[];
}): Promise<string> {
  const to = process.env.NOTIFY_EMAIL ?? "tiana@wholisticvibeswellness.com";

  const block = (emoji: string, label: string, color: string, rows: string[]) => `
    <div style="margin:16px 0 0;padding:16px 20px;background:#F5F0E8;border-radius:12px;border-left:4px solid ${color};">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${color};text-transform:uppercase;">${emoji} ${label}</p>
      ${rows.map(r => `<p style="margin:3px 0;font-size:14px;color:#1A1714;">${r}</p>`).join("")}
    </div>`;

  let bodyHtml = "";
  if (sections.overdue?.length)
    bodyHtml += block("⚠️", "Overdue", "#C4625A", sections.overdue.map(t => `${t.title} <span style="color:#999;font-size:12px;">(was due ${t.due_date})</span>`));
  if (sections.dueToday?.length)
    bodyHtml += block("🔥", "Due Today", "#D4842A", sections.dueToday.map(t => t.title));
  if (sections.dueTomorrow?.length)
    bodyHtml += block("⏰", "Due Tomorrow", "#B8A06A", sections.dueTomorrow.map(t => t.title));
  if (sections.dueSoon?.length)
    bodyHtml += block("📅", "Coming Up (3 days)", "#4A5E4F", sections.dueSoon.map(t => `${t.title} <span style="color:#999;font-size:12px;">— due ${t.due_date}</span>`));

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Deadline Alert</title></head>
<body style="margin:0;padding:32px 16px;background:#1A1714;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">
  <tr><td style="background:#1C2A3A;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#B8A06A;">WVW Command Center</p>
    <h1 style="margin:0;font-size:26px;font-weight:400;color:#F5F0E8;">Deadline Check-In 📋</h1>
  </td></tr>
  <tr><td style="background:#FAFAF7;padding:24px 32px 32px;">
    <p style="margin:0 0 4px;font-size:14px;color:#1A1714;">Queen, here's what needs your eyes today.</p>
    ${bodyHtml}
    <p style="margin:20px 0 0;font-size:13px;color:#4A5E4F;font-style:italic;">You got this. 👑</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const resend = client();
  const { data: result, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "⏰ Deadline Check-In — WVW Command Center",
    html,
  });
  if (error) throw new Error(error.message);
  return result?.id ?? "";
}
