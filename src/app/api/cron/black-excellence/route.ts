import { NextRequest } from "next/server";
import { generateBlackExcellence, getTodayBlackExcellenceCategory } from "@/lib/generate-posts";
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

  // Threads (Buffer)
  {
    const profileId = process.env.BUFFER_PROFILE_THREADS;
    if (process.env.BUFFER_ACCESS_TOKEN && profileId) {
      results.threads = await run(() => queueInBuffer([profileId], posts.threads));
    } else {
      results.threads = { status: "skipped", error: "Threads Buffer not configured" };
    }
  }

  // Bluesky Personal (Tiána's account)
  if (process.env.BLUESKY_PERSONAL_IDENTIFIER && process.env.BLUESKY_PERSONAL_APP_PASSWORD) {
    results.bluesky_personal = await run(() => postToBlueskyPersonal(posts.bluesky_personal));
  } else {
    results.bluesky_personal = { status: "skipped", error: "Personal Bluesky not configured" };
  }

  // ── WVW org pages — consulting/brand lens ──

  // LinkedIn WVW Page (Buffer)
  {
    const profileId = process.env.BUFFER_PROFILE_LINKEDIN_WVW;
    if (process.env.BUFFER_ACCESS_TOKEN && profileId) {
      results.linkedin_wvw = await run(() => queueInBuffer([profileId], posts.linkedin_wvw));
    } else {
      results.linkedin_wvw = { status: "skipped", error: "LinkedIn WVW Buffer not configured" };
    }
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
      text: platform === "threads" ? posts.threads
          : platform === "bluesky_personal" ? posts.bluesky_personal
          : platform === "linkedin_wvw" ? posts.linkedin_wvw
          : platform === "facebook" ? posts.facebook
          : posts.bluesky_wvw,
      status: r.status as "posted" | "queued" | "error" | "skipped",
      error_detail: r.error,
    });
  });

  void sendCronSummary("Black Excellence", category, results);
  return Response.json({ category, subject: posts.subject, results, timestamp: new Date().toISOString() });
}
