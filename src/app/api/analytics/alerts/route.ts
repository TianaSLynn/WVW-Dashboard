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
}

export async function GET() {
  const alerts: Alert[] = [];

  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const since7  = new Date(Date.now() - 7  * 86400000).toISOString();

  const [{ data: recentPosts }, { data: recentLeads }] = await Promise.all([
    supabase.from("post_log").select("platform, theme, created_at, status").gte("created_at", since30).eq("status", "posted"),
    supabase.from("leads").select("platform, date, follow_up_status, lead_flag").gte("date", since7.split("T")[0]),
  ]);

  const posts = recentPosts ?? [];
  const leads = recentLeads ?? [];

  // ── Pillar gap alerts ──
  for (const pillar of PILLARS) {
    const pillarPosts = posts.filter((p) => {
      const theme = (p as { theme: string }).theme ?? "";
      return theme.toLowerCase().includes(pillar.toLowerCase().split("/")[0].trim().toLowerCase());
    });

    if (pillarPosts.length === 0) {
      const daysSince = 30;
      alerts.push({
        type: "pillar_gap",
        severity: "warning",
        title: `${pillar} — not posted this month`,
        body: `No posts tagged to "${pillar}" in the last 30 days. Consider queuing a piece.`,
      });
    } else {
      const latest = pillarPosts.reduce((a, b) => {
        const aTime = new Date((a as { created_at: string }).created_at).getTime();
        const bTime = new Date((b as { created_at: string }).created_at).getTime();
        return aTime > bTime ? a : b;
      });
      const daysSince = Math.floor((Date.now() - new Date((latest as { created_at: string }).created_at).getTime()) / 86400000);
      if (daysSince >= 6) {
        alerts.push({
          type: "pillar_gap",
          severity: "warning",
          title: `${pillar} — ${daysSince} days since last post`,
          body: `Your last "${pillar}" post was ${daysSince} days ago. Your audience expects regular content here.`,
        });
      }
    }
  }

  // ── Lead spike alerts ──
  const hotLeads = leads.filter((l) => (l as { lead_flag: boolean }).lead_flag);
  const needsResponse = leads.filter((l) => (l as { follow_up_status: string }).follow_up_status === "Needs Response");

  if (needsResponse.length > 0) {
    alerts.push({
      type: "lead_spike",
      severity: "warning",
      title: `${needsResponse.length} lead${needsResponse.length > 1 ? "s" : ""} need a response`,
      body: "Open the Community tab to see who's waiting. Fast responses increase conversion rates significantly.",
    });
  }

  if (hotLeads.length > 0) {
    alerts.push({
      type: "lead_spike",
      severity: "success",
      title: `${hotLeads.length} active lead${hotLeads.length > 1 ? "s" : ""} this week`,
      body: "Check the Community tab for follow-up opportunities.",
    });
  }

  // ── Platform silence alerts ──
  const activePlatforms = ["linkedin_personal", "linkedin_wvw", "threads", "bluesky", "bluesky_personal", "facebook"];
  for (const platform of activePlatforms) {
    const platPosts = posts.filter((p) => (p as { platform: string }).platform === platform);
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
  const postCount = posts.length;
  if (postCount >= 5) {
    alerts.push({
      type: "top_performer",
      severity: "success",
      title: `${postCount} posts live in the last 30 days`,
      body: "Your publishing cadence is active. Check Lead Attribution in the Intelligence tab to see what's driving business.",
    });
  }

  return Response.json({ alerts: alerts.slice(0, 8), timestamp: new Date().toISOString() });
}
