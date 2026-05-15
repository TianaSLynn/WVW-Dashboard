import { NextRequest } from "next/server";
import { generateDailyPosts } from "@/lib/generate-posts";
import { postToBluesky, postToBlueskyPersonal } from "@/lib/bluesky";
import { postToThreads } from "@/lib/facebook";
import { appendPostLog } from "@/lib/logger";
import { getTodayTheme } from "@/lib/schedule";

export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

type Result = { status: string; error?: string };

async function run(fn: () => Promise<unknown>): Promise<Result> {
  try { await fn(); return { status: "posted" }; }
  catch (err) { return { status: "error", error: String(err) }; }
}

// Morning cron: 8am ET (13:00 UTC).
// Posts a second daily piece to high-volume platforms (Threads, Bluesky).
// These platforms reward volume — 2x/day drives reach significantly.
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const theme = getTodayTheme();
  const platforms = ["threads", "bluesky", "bluesky_personal"] as const;

  let posts: Awaited<ReturnType<typeof generateDailyPosts>>;
  try {
    posts = await generateDailyPosts(theme, [...platforms]);
  } catch (err) {
    return Response.json({ error: "Morning generation failed", detail: String(err) }, { status: 500 });
  }

  const results: Record<string, Result> = {};

  // Threads — morning observation
  if (process.env.THREADS_ACCESS_TOKEN && process.env.THREADS_USER_ID) {
    results.threads = await run(() => postToThreads(posts.threads ?? ""));
  } else {
    results.threads = { status: "skipped", error: "Threads not configured" };
  }

  // Bluesky WVW — brand voice
  if (process.env.BLUESKY_IDENTIFIER && process.env.BLUESKY_APP_PASSWORD) {
    results.bluesky = await run(() => postToBluesky(posts.bluesky ?? ""));
  } else {
    results.bluesky = { status: "skipped", error: "Bluesky WVW not configured" };
  }

  // Bluesky Personal (Tiána) — personal reflection
  if (process.env.BLUESKY_PERSONAL_IDENTIFIER && process.env.BLUESKY_PERSONAL_APP_PASSWORD) {
    results.bluesky_personal = await run(() => postToBlueskyPersonal(posts.bluesky_personal ?? ""));
  } else {
    results.bluesky_personal = { status: "skipped", error: "Personal Bluesky not configured" };
  }

  Object.entries(results).forEach(([platform, r]) => {
    void appendPostLog({
      platform,
      theme: `[Morning] ${theme}`,
      text: (posts[platform as keyof typeof posts] ?? "") as string,
      status: r.status as "posted" | "queued" | "error" | "skipped",
    });
  });

  return Response.json({
    slot: "morning",
    theme,
    platforms: Object.keys(results),
    results,
    timestamp: new Date().toISOString(),
  });
}
