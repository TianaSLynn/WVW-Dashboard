import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function platformLabel(p: string): string {
  const map: Record<string, string> = {
    linkedin_personal: "LinkedIn Personal",
    linkedin_wvw:      "LinkedIn WVW",
    instagram:         "Instagram",
    tiktok:            "TikTok",
    facebook:          "Facebook",
    threads:           "Threads",
    bluesky:           "Bluesky",
    bluesky_personal:  "Bluesky Personal",
  };
  return map[p] ?? p;
}

export async function GET() {
  const { data, error } = await supabase
    .from("post_log")
    .select("id, created_at, platform, theme, status, excerpt")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return Response.json({ rows: [], byPlatform: {}, byStatus: {}, byTheme: {}, total: 0 });

  const rows = data ?? [];

  const byPlatform = rows.reduce<Record<string, number>>((acc, r) => {
    const label = platformLabel(r.platform as string);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
    const s = String(r.status ?? "unknown");
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const byTheme = rows.reduce<Record<string, number>>((acc, r) => {
    const t = String(r.theme ?? "general");
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  const recent = rows.slice(0, 30).map((r) => ({
    id: String(r.id),
    date: String(r.created_at ?? "").slice(0, 10),
    channel: platformLabel(r.platform as string),
    topic: String(r.excerpt ?? "").slice(0, 120) || String(r.theme ?? ""),
    theme: String(r.theme ?? ""),
    status: r.status === "posted" ? "Posted" : r.status === "error" ? "Error" : "Draft",
    content_type: "post",
  }));

  return Response.json({ rows: recent, byPlatform, byStatus, byTheme, total: rows.length });
}
