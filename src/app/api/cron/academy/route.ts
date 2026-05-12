import { NextRequest } from "next/server";
import { generateDailyPosts } from "@/lib/generate-posts";
import { postToLinkedIn } from "@/lib/linkedin";
import { postToFacebook, postToThreads } from "@/lib/facebook";
import { postToBluesky, postToBlueskyPersonal } from "@/lib/bluesky";
import { postToTwitter } from "@/lib/twitter";
import { appendPostLog } from "@/lib/logger";

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

// Academy cron posts WVW Academy-themed content to LinkedIn, Threads, Twitter, Bluesky.
// Runs at 4pm ET (21:00 UTC) daily — separate from the 12pm ET consulting content cron.
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const theme = "WVW Academy";
  const platforms = ["linkedin_personal", "linkedin_wvw", "threads", "twitter", "bluesky_personal"] as const;

  let posts: Awaited<ReturnType<typeof generateDailyPosts>>;
  try {
    posts = await generateDailyPosts(theme, [...platforms]);
  } catch (err) {
    return Response.json({ error: "Academy generation failed", detail: String(err) }, { status: 500 });
  }

  const results: Record<string, Result> = {};

  // LinkedIn Personal (Tiána — practitioner voice)
  if (process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_PERSON_URN) {
    results.linkedin_personal = await run(() =>
      postToLinkedIn(posts.linkedin_personal ?? "", process.env.LINKEDIN_PERSON_URN!)
    );
  } else {
    results.linkedin_personal = { status: "skipped", error: "LinkedIn Personal not configured" };
  }

  // LinkedIn WVW Page (Academy positioning for org buyers)
  if (process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_ORG_URN) {
    results.linkedin_wvw = await run(() =>
      postToLinkedIn(posts.linkedin_wvw ?? "", process.env.LINKEDIN_ORG_URN!)
    );
  } else {
    results.linkedin_wvw = { status: "skipped", error: "LinkedIn WVW not configured" };
  }

  // Threads
  if (process.env.THREADS_ACCESS_TOKEN && process.env.THREADS_USER_ID) {
    results.threads = await run(() => postToThreads(posts.threads ?? ""));
  } else {
    results.threads = { status: "skipped", error: "Threads not configured" };
  }

  // Twitter/X
  if (process.env.TWITTER_API_KEY && process.env.TWITTER_ACCESS_TOKEN) {
    results.twitter = await run(() => postToTwitter(posts.twitter ?? ""));
  } else {
    results.twitter = { status: "skipped", error: "Twitter not configured" };
  }

  // Bluesky Personal (Tiána's account)
  if (process.env.BLUESKY_PERSONAL_IDENTIFIER && process.env.BLUESKY_PERSONAL_APP_PASSWORD) {
    results.bluesky_personal = await run(() => postToBlueskyPersonal(posts.bluesky_personal ?? ""));
  } else {
    results.bluesky_personal = { status: "skipped", error: "Personal Bluesky not configured" };
  }

  // Log all results
  Object.entries(results).forEach(([platform, r]) => {
    void appendPostLog({
      platform,
      theme,
      text: (posts[platform as keyof typeof posts] ?? "") as string,
      status: r.status as "posted" | "queued" | "error" | "skipped",
    });
  });

  return Response.json({
    theme,
    platforms: Object.keys(results),
    results,
    timestamp: new Date().toISOString(),
  });
}
