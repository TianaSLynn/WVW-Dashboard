import { supabase } from "@/lib/supabase";

export async function GET() {
  // Pull post_log and leads from the last 90 days
  const since = new Date(Date.now() - 90 * 86400000).toISOString();

  const [{ data: posts }, { data: leads }] = await Promise.all([
    supabase.from("post_log").select("platform, theme, status, created_at").gte("created_at", since),
    supabase.from("leads").select("platform, date, lead_flag, follow_up_status, message_summary").gte("date", since.split("T")[0]),
  ]);

  if (!posts || !leads) {
    return Response.json({ attribution: [], topThemes: [], topPlatforms: [] });
  }

  // Group posts by theme, count leads within 72h of each post
  const themeMap: Record<string, { posts: number; leads: number; conversions: number }> = {};
  const platformMap: Record<string, { posts: number; leads: number }> = {};

  for (const post of posts) {
    const theme = (post as { theme: string }).theme ?? "Unknown";
    const platform = (post as { platform: string }).platform ?? "Unknown";
    const postTime = new Date((post as { created_at: string }).created_at).getTime();

    if (!themeMap[theme]) themeMap[theme] = { posts: 0, leads: 0, conversions: 0 };
    themeMap[theme].posts++;

    if (!platformMap[platform]) platformMap[platform] = { posts: 0, leads: 0 };
    platformMap[platform].posts++;

    // Count leads that came in within 72 hours after this post
    for (const lead of leads) {
      const leadTime = new Date((lead as { date: string }).date).getTime();
      const diff = leadTime - postTime;
      if (diff >= 0 && diff <= 72 * 3600000) {
        themeMap[theme].leads++;
        if ((lead as { follow_up_status: string }).follow_up_status === "Booked Call" ||
            (lead as { follow_up_status: string }).follow_up_status === "Closed") {
          themeMap[theme].conversions++;
        }
        if ((lead as { platform: string }).platform === platform) {
          platformMap[platform].leads++;
        }
      }
    }
  }

  const topThemes = Object.entries(themeMap)
    .map(([theme, stats]) => ({ theme, ...stats, score: stats.leads * 3 + stats.conversions * 10 + stats.posts }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const topPlatforms = Object.entries(platformMap)
    .map(([platform, stats]) => ({ platform, ...stats }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 10);

  return Response.json({ topThemes, topPlatforms, totalPosts: posts.length, totalLeads: leads.length });
}
