import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchBlueskyStats } from "@/lib/bluesky";

export const runtime = "edge";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// Pulls real engagement counts (likes/reposts/replies/quotes) for recently
// posted Bluesky posts and writes them back onto post_log, using each post's
// stored post_uri (captured at post time -- see src/lib/bluesky.ts). This is
// what makes the Analyze/Repurpose engine's Bluesky numbers real instead of
// zeroed placeholders.
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from<{ id: string; post_uri: string; platform: string }>("post_log")
    .select("id, post_uri, platform")
    .in("platform", ["bluesky", "bluesky_personal"])
    .eq("status", "posted")
    .gte("created_at", since)
    .limit(500);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const withUri = (rows ?? []).filter((r) => r.post_uri);
  if (withUri.length === 0) {
    return Response.json({ synced: 0, message: "No Bluesky posts with a stored post_uri in the last 30 days" });
  }

  const uris = [...new Set(withUri.map((r) => r.post_uri))];
  let stats: Awaited<ReturnType<typeof fetchBlueskyStats>>;
  try {
    stats = await fetchBlueskyStats(uris);
  } catch (err) {
    return Response.json({ error: "Bluesky getPosts failed", detail: String(err) }, { status: 502 });
  }

  const statsByUri = new Map(stats.map((s) => [s.uri, s]));
  const now = new Date().toISOString();
  let synced = 0;

  for (const row of withUri) {
    const s = statsByUri.get(row.post_uri);
    if (!s) continue; // post may have been deleted from Bluesky
    const { error: updErr } = await supabase
      .from("post_log")
      .update({
        likes: s.likeCount,
        reposts: s.repostCount,
        replies: s.replyCount,
        quotes: s.quoteCount,
        stats_updated_at: now,
      })
      .eq("id", row.id);
    if (!updErr) synced += 1;
  }

  return Response.json({ synced, checked: withUri.length, timestamp: now });
}
