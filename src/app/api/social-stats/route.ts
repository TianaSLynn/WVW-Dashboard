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
  const { data, error } = await supabase
    .from("social_stats")
    .select("*")
    .order("platform");

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Ensure all platforms present; fill missing ones with zeros
  const existing = new Map((data ?? []).map((r: { platform: string }) => [r.platform, r]));
  const merged = DEFAULT_PLATFORMS.map((p) =>
    existing.get(p) ?? { platform: p, followers: 0, engagement: 0, ctr: 0, posts: 0, lead_score: 0, updated_at: null }
  );

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
