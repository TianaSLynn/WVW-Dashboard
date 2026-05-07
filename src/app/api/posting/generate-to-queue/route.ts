import { NextRequest } from "next/server";
import { getTodayPlatforms, getTodayTheme } from "@/lib/schedule";
import { generateDailyPosts } from "@/lib/generate-posts";
import { supabase } from "@/lib/supabase";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { theme?: string; platforms?: string[] };

  const platforms = body.platforms
    ? (body.platforms as ReturnType<typeof getTodayPlatforms>)
    : getTodayPlatforms();
  const theme = body.theme ?? getTodayTheme();

  if (platforms.length === 0) {
    return Response.json({ message: "No platforms scheduled today", theme, queued: 0 });
  }

  let posts: Awaited<ReturnType<typeof generateDailyPosts>>;
  try {
    posts = await generateDailyPosts(theme, platforms);
  } catch (err) {
    return Response.json({ error: "Generation failed", detail: String(err) }, { status: 500 });
  }

  const rows = Object.entries(posts)
    .filter(([, text]) => typeof text === "string" && text.length > 0)
    .map(([platform, text]) => ({ platform, theme, text: text as string, status: "draft" }));

  const { error } = await supabase.from("content_queue").insert(rows);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ theme, platforms, queued: rows.length, items: rows.map((r) => r.platform) });
}
