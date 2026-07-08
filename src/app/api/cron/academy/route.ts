import { NextRequest } from "next/server";
import { generateDailyPosts } from "@/lib/generate-posts";
import { postToFacebook } from "@/lib/facebook";
import { postToBluesky, postToBlueskyPersonal } from "@/lib/bluesky";
import { queueInBuffer } from "@/lib/buffer";
import { appendPostLog } from "@/lib/logger";
import { sendCronSummary } from "@/lib/notify";

export const runtime = 'edge';

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

// Academy cron posts WVW Academy-themed content to LinkedIn, Threads, Bluesky, Facebook.
// Runs at 4pm ET (21:00 UTC) daily — separate from the 12pm ET consulting content cron.
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const theme = "WVW Academy";
  const platforms = ["linkedin_personal", "linkedin_wvw", "threads", "bluesky_personal", "facebook"] as const;

  let posts: Awaited<ReturnType<typeof generateDailyPosts>>;
  try {
    posts = await generateDailyPosts(theme, [...platforms]);
  } catch (err) {
    return Response.json({ error: "Academy generation failed", detail: String(err) }, { status: 500 });
  }

  const results: Record<string, Result> = {};

  // LinkedIn Personal (Buffer — Tiána, practitioner voice)
  {
    const profileId = process.env.BUFFER_PROFILE_LINKEDIN_PERSONAL;
    if (process.env.BUFFER_ACCESS_TOKEN && profileId) {
      results.linkedin_personal = await run(() => queueInBuffer([profileId], posts.linkedin_personal ?? ""));
    } else {
      results.linkedin_personal = { status: "skipped", error: "LinkedIn Personal Buffer not configured" };
    }
  }

  // LinkedIn WVW Page (Buffer — Academy positioning for org buyers)
  {
    const profileId = process.env.BUFFER_PROFILE_LINKEDIN_WVW;
    if (process.env.BUFFER_ACCESS_TOKEN && profileId) {
      results.linkedin_wvw = await run(() => queueInBuffer([profileId], posts.linkedin_wvw ?? ""));
    } else {
      results.linkedin_wvw = { status: "skipped", error: "LinkedIn WVW Buffer not configured" };
    }
  }

  // Threads (Buffer)
  {
    const profileId = process.env.BUFFER_PROFILE_THREADS;
    if (process.env.BUFFER_ACCESS_TOKEN && profileId) {
      results.threads = await run(() => queueInBuffer([profileId], posts.threads ?? ""));
    } else {
      results.threads = { status: "skipped", error: "Threads Buffer not configured" };
    }
  }

  // Bluesky Personal (Tiána's account)
  if (process.env.BLUESKY_PERSONAL_IDENTIFIER && process.env.BLUESKY_PERSONAL_APP_PASSWORD) {
    results.bluesky_personal = await run(() => postToBlueskyPersonal(posts.bluesky_personal ?? ""));
  } else {
    results.bluesky_personal = { status: "skipped", error: "Personal Bluesky not configured" };
  }

  // Facebook
  if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID) {
    results.facebook = await run(() => postToFacebook(posts.facebook ?? ""));
  } else {
    results.facebook = { status: "skipped", error: "Facebook not configured" };
  }

  // Log all results
  Object.entries(results).forEach(([platform, r]) => {
    void appendPostLog({
      platform,
      theme,
      text: (posts[platform as keyof typeof posts] ?? "") as string,
      status: r.status as "posted" | "queued" | "error" | "skipped",
      error_detail: r.error,
    });
  });

  void sendCronSummary("WVW Academy", theme, results);
  return Response.json({
    theme,
    platforms: Object.keys(results),
    results,
    timestamp: new Date().toISOString(),
  });
}
