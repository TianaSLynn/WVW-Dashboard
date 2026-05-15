import { supabase } from "@/lib/supabase";

const PILLARS = [
  "Black Mental Health",
  "Psychological Safety",
  "Neuroinclusion",
  "Burnout / Moral Injury",
  "CEO / BTS",
  "Unicorn Wisdoms",
];

export interface Alert {
  type: "pillar_gap" | "lead_spike" | "platform_silent" | "top_performer";
  severity: "info" | "warning" | "success";
  title: string;
  body: string;
  pillar?: string;
  action?: { label: string; tab?: string };
}

// Day of week 0=Sun 1=Mon ... 6=Sat
const DAY_SCHEDULE: Record<number, string[]> = {
  1: ["linkedin_personal", "linkedin_wvw", "instagram"],
  2: ["threads", "bluesky", "bluesky_personal"],
  3: ["linkedin_personal", "linkedin_wvw", "facebook"],
  4: ["threads", "bluesky", "bluesky_personal"],
  5: ["linkedin_personal", "instagram", "facebook"],
  6: ["threads", "bluesky"],
  0: [],
};

export async function GET() {
  const alerts: Alert[] = [];

  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const since7  = new Date(Date.now() - 7  * 86400000).toISOString();

  let posts: { platform: string; theme: string; created_at: string; status: string }[] = [];
  let leads: { platform: string; date: string; follow_up_status: string; lead_flag: boolean }[] = [];

  try {
    const [postsRes, leadsRes] = await Promise.all([
      supabase.from("post_log").select("platform, theme, created_at, status").gte("created_at", since30).eq("status", "posted"),
      supabase.from("leads").select("platform, date, follow_up_status, lead_flag").gte("date", since7.split("T")[0]),
    ]);
    posts = (postsRes.data ?? []) as typeof posts;
    leads = (leadsRes.data ?? []) as typeof leads;
  } catch {
    // Supabase unavailable — continue with empty arrays, schedule-based alerts still fire
  }

  // ── Schedule-based alerts (always fire, no data needed) ──
  const today = new Date();
  const dow = today.getDay();
  const todayPlatforms = DAY_SCHEDULE[dow] ?? [];
  const hour = today.getUTCHours(); // UTC

  if (todayPlatforms.length > 0) {
    const isPostingTime = hour >= 16 && hour < 22; // 12pm-6pm ET = 16-22 UTC
    if (isPostingTime) {
      alerts.push({
        type: "pillar_gap",
        severity: "info",
        title: "Posting window is open",
        body: `Today's scheduled platforms: ${todayPlatforms.map((p) => p.replace(/_/g, " ")).join(", ")}. Use the Auto-Post tab to trigger now.`,
        action: { label: "Go to Auto-Post", tab: "autopost" },
      });
    } else if (hour < 16) {
      alerts.push({
        type: "pillar_gap",
        severity: "info",
        title: "Content posts at noon ET today",
        body: `Scheduled: ${todayPlatforms.map((p) => p.replace(/_/g, " ")).join(", ")}. Academy posts at 4pm ET.`,
      });
    }
  }

  // Always flag all 6 pillars as needing attention when no Supabase data exists
  if (posts.length === 0) {
    alerts.push({
      type: "pillar_gap",
      severity: "warning",
      title: "No posts logged yet",
      body: "Your post log is empty. Once content goes live, strategy alerts will track pillar gaps, cadence, and platform performance here automatically.",
      action: { label: "Trigger First Post", tab: "autopost" },
    });

    // Surface the full pillar list as action items
    for (const pillar of PILLARS) {
      alerts.push({
        type: "pillar_gap",
        severity: "info",
        title: `${pillar} — queue your first post`,
        body: `WVW has no ${pillar} content posted yet. This is a high-authority pillar for your audience.`,
        pillar,
        action: { label: "Create Post" },
      });
    }
  } else {
    // ── Pillar gap alerts (with data) ──
    for (const pillar of PILLARS) {
      const pillarPosts = posts.filter((p) => {
        const theme = p.theme ?? "";
        return theme.toLowerCase().includes(pillar.toLowerCase().split("/")[0].trim().toLowerCase());
      });

      if (pillarPosts.length === 0) {
        alerts.push({
          type: "pillar_gap",
          severity: "warning",
          title: `${pillar} — not posted this month`,
          body: `No posts tagged to "${pillar}" in the last 30 days. Consider queuing a piece.`,
          pillar,
          action: { label: "Create Post" },
        });
      } else {
        const latest = pillarPosts.reduce((a, b) =>
          new Date(a.created_at).getTime() > new Date(b.created_at).getTime() ? a : b
        );
        const daysSince = Math.floor((Date.now() - new Date(latest.created_at).getTime()) / 86400000);
        if (daysSince >= 6) {
          alerts.push({
            type: "pillar_gap",
            severity: "warning",
            title: `${pillar} — ${daysSince} days since last post`,
            body: `Your last "${pillar}" post was ${daysSince} days ago. Your audience expects regular content here.`,
            pillar,
            action: { label: "Create Post" },
          });
        }
      }
    }

    // ── Platform silence alerts ──
    const activePlatforms = ["linkedin_personal", "linkedin_wvw", "threads", "bluesky", "bluesky_personal", "facebook"];
    for (const platform of activePlatforms) {
      const platPosts = posts.filter((p) => p.platform === platform);
      if (platPosts.length === 0) {
        alerts.push({
          type: "platform_silent",
          severity: "info",
          title: `${platform.replace(/_/g, " ")} — no posts in 30 days`,
          body: "This platform hasn't posted recently. Check credentials in Settings.",
        });
      }
    }

    // ── Top performer insight ──
    if (posts.length >= 5) {
      alerts.push({
        type: "top_performer",
        severity: "success",
        title: `${posts.length} posts live in the last 30 days`,
        body: "Your publishing cadence is active. Check Lead Attribution in the Intelligence tab to see what's driving business.",
      });
    }
  }

  // ── Lead alerts ──
  const hotLeads = leads.filter((l) => l.lead_flag);
  const needsResponse = leads.filter((l) => l.follow_up_status === "Needs Response");

  if (needsResponse.length > 0) {
    alerts.push({
      type: "lead_spike",
      severity: "warning",
      title: `${needsResponse.length} lead${needsResponse.length > 1 ? "s" : ""} need a response`,
      body: "Open the Community tab to see who's waiting. Fast responses increase conversion rates significantly.",
      action: { label: "View Community", tab: "community" },
    });
  }

  if (hotLeads.length > 0) {
    alerts.push({
      type: "lead_spike",
      severity: "success",
      title: `${hotLeads.length} active lead${hotLeads.length > 1 ? "s" : ""} this week`,
      body: "Check the Community tab for follow-up opportunities.",
      action: { label: "View Community", tab: "community" },
    });
  }

  return Response.json(
    { alerts: alerts.slice(0, 10), timestamp: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store", "CDN-Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store" } }
  );
}
