import { NextRequest } from "next/server";
import { generateBlackExcellence, getTodayBlackExcellenceCategory } from "@/lib/generate-posts";
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

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const category = getTodayBlackExcellenceCategory();

  let posts: Awaited<ReturnType<typeof generateBlackExcellence>>;
  try {
    posts = await generateBlackExcellence(category);
  } catch (err) {
    return Response.json({ error: "Generation failed", detail: String(err) }, { status: 500 });
  }

  const theme = `Black Excellence · ${category} · ${posts.subject}`;
  const results: Record<string, Result> = {};

  // ── Community platforms — educational/honoring content ──

  // Twitter
  if (process.env.TWITTER_API_KEY && process.env.TWITTER_ACCESS_TOKEN) {
    results.twitter = await run(() => postToTwitter(posts.twitter));
  } else {
    results.twitter = { status: "skipped", error: "Twitter not configured" };
  }

  // Threads
  if (process.env.THREADS_ACCESS_TOKEN && process.env.THREADS_USER_ID) {
    results.threads = await run(() => postToThreads(posts.threads));
  } else {
    results.threads = { status: "skipped", error: "Threads not configured" };
  }

  // Bluesky Personal (Tiána's account)
  if (process.env.BLUESKY_PERSONAL_IDENTIFIER && process.env.BLUESKY_PERSONAL_APP_PASSWORD) {
    results.bluesky_personal = await run(() => postToBlueskyPersonal(posts.bluesky_personal));
  } else {
    results.bluesky_personal = { status: "skipped", error: "Personal Bluesky not configured" };
  }

  // ── WVW org pages — consulting/brand lens ──

  // LinkedIn WVW Page
  const orgUrn = process.env.LINKEDIN_ORG_URN;
  if (process.env.LINKEDIN_ACCESS_TOKEN && orgUrn) {
    results.linkedin_wvw = await run(() => postToLinkedIn(posts.linkedin_wvw, orgUrn));
  } else {
    results.linkedin_wvw = { status: "skipped", error: "LinkedIn WVW not configured" };
  }

  // Facebook WVW Page
  if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID) {
    results.facebook = await run(() => postToFacebook(posts.facebook));
  } else {
    results.facebook = { status: "skipped", error: "Facebook not configured" };
  }

  // Bluesky WVW
  if (process.env.BLUESKY_IDENTIFIER && process.env.BLUESKY_APP_PASSWORD) {
    results.bluesky_wvw = await run(() => postToBluesky(posts.bluesky_wvw));
  } else {
    results.bluesky_wvw = { status: "skipped", error: "Bluesky WVW not configured" };
  }

  Object.entries(results).forEach(([platform, r]) => {
    void appendPostLog({
      platform,
      theme,
      text: platform === "twitter" ? posts.twitter
          : platform === "threads" ? posts.threads
          : platform === "bluesky_personal" ? posts.bluesky_personal
          : platform === "linkedin_wvw" ? posts.linkedin_wvw
          : platform === "facebook" ? posts.facebook
          : posts.bluesky_wvw,
      status: r.status as "posted" | "queued" | "error" | "skipped",
    });
  });

  return Response.json({ category, subject: posts.subject, results, timestamp: new Date().toISOString() });
}
