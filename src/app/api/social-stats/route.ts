import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

const DEFAULT_PLATFORMS = [
  "LinkedIn Personal",
  "LinkedIn WVW",
  "Instagram",
  "TikTok",
  "Threads",
  "Facebook",
  "Bluesky",
];

export async function GET() {
  const [{ data, error }, { data: postCounts }] = await Promise.all([
    supabase.from("social_stats").select("*").order("platform"),
    supabase.from("post_log").select("platform").eq("status", "posted"),
  ]);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Count real posts per platform from post_log
  const realPostCounts: Record<string, number> = {};
  for (const row of postCounts ?? []) {
    const p = String(row.platform);
    realPostCounts[p] = (realPostCounts[p] ?? 0) + 1;
  }

  // Map post_log platform keys to display names
  const platformKeyToDisplay: Record<string, string> = {
    linkedin_personal: "LinkedIn Personal",
    linkedin_wvw:      "LinkedIn WVW",
    instagram:         "Instagram",
    tiktok:            "TikTok",
    facebook:          "Facebook",
    threads:           "Threads",
    bluesky:           "Bluesky",
    bluesky_personal:  "Bluesky",
  };

  const displayPostCounts: Record<string, number> = {};
  for (const [key, count] of Object.entries(realPostCounts)) {
    const label = platformKeyToDisplay[key] ?? key;
    displayPostCounts[label] = (displayPostCounts[label] ?? 0) + count;
  }

  type StatRecord = { platform: string; followers: number; engagement: number; ctr: number; posts: number; lead_score: number; updated_at: string | null };
  const existing = new Map((data ?? []).map((r) => [String((r as { platform: string }).platform), r as StatRecord]));
  const merged = DEFAULT_PLATFORMS.map((p) => {
    const saved: StatRecord = existing.get(p) ?? { platform: p, followers: 0, engagement: 0, ctr: 0, posts: 0, lead_score: 0, updated_at: null };
    return { ...saved, posts: displayPostCounts[p] ?? saved.posts };
  });

  return Response.json(merged, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const rows = await req.json() as Array<{
    platform: string;
    followers: number;
    engagement: number;
    ctr: number;
    posts: number;
    lead_score: number;
  }>;

  if (!Array.isArray(rows) || rows.length === 0) {
    return Response.json({ error: "Provide an array of platform stats" }, { status: 400 });
  }

  const { error } = await supabase
    .from("social_stats")
    .upsert(
      rows.map((r) => ({ ...r, updated_at: new Date().toISOString() })),
      { onConflict: "platform" }
    );

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ saved: rows.length });
}
