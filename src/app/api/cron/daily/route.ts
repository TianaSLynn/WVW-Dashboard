import { NextRequest } from "next/server";
import { getTodayPlatforms, getTodayTheme } from "@/lib/schedule";
import type { Platform } from "@/lib/schedule";
import { generateDailyPosts } from "@/lib/generate-posts";
import { postToLinkedIn } from "@/lib/linkedin";
import { postToTwitter } from "@/lib/twitter";
import { postToBluesky } from "@/lib/bluesky";
import { postToFacebook, postToInstagram, postToThreads } from "@/lib/facebook";
import { queueInBuffer } from "@/lib/buffer";
import { appendPostLog } from "@/lib/logger";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

type Result = { status: string; error?: string };

async function run(
  label: string,
  fn: () => Promise<unknown>
): Promise<Result> {
  try {
    await fn();
    return { status: "posted" };
  } catch (err) {
    return { status: "error", error: String(err) };
  }
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platforms = getTodayPlatforms();
  const theme = getTodayTheme();

  if (platforms.length === 0) {
    return Response.json({ message: "No platforms scheduled today", theme });
  }

  let posts;
  try {
    posts = await generateDailyPosts(theme, platforms);
  } catch (err) {
    return Response.json({ error: "Generation failed", detail: String(err) }, { status: 500 });
  }

  const results: Record<string, Result> = {};
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://wvw-dashboard.vercel.app";

  const log = (platform: string, text: string, r: Result) => {
    results[platform] = r;
    appendPostLog({ platform, theme, text, status: r.status as "posted" | "queued" | "error" | "skipped" });
  };

  // ── LinkedIn Personal ──
  if (platforms.includes("linkedin_personal") && posts.linkedin_personal) {
    const urn = process.env.LINKEDIN_PERSON_URN;
    if (!urn) {
      log("linkedin_personal", posts.linkedin_personal, { status: "skipped", error: "LINKEDIN_PERSON_URN not set" });
    } else {
      log("linkedin_personal", posts.linkedin_personal, await run("linkedin_personal", () => postToLinkedIn(posts.linkedin_personal!, urn)));
    }
  }

  // ── LinkedIn WVW Page ──
  if (platforms.includes("linkedin_wvw") && posts.linkedin_wvw) {
    const urn = process.env.LINKEDIN_ORG_URN;
    if (!urn) {
      log("linkedin_wvw", posts.linkedin_wvw, { status: "skipped", error: "LINKEDIN_ORG_URN not set" });
    } else {
      log("linkedin_wvw", posts.linkedin_wvw, await run("linkedin_wvw", () => postToLinkedIn(posts.linkedin_wvw!, urn)));
    }
  }

  // ── X / Twitter ──
  if (platforms.includes("twitter") && posts.twitter) {
    if (!process.env.TWITTER_API_KEY) {
      log("twitter", posts.twitter, { status: "skipped", error: "Twitter not configured" });
    } else {
      log("twitter", posts.twitter, await run("twitter", () => postToTwitter(posts.twitter!)));
    }
  }

  // ── Bluesky ──
  if (platforms.includes("bluesky") && posts.bluesky) {
    if (!process.env.BLUESKY_IDENTIFIER) {
      log("bluesky", posts.bluesky, { status: "skipped", error: "Bluesky not configured" });
    } else {
      log("bluesky", posts.bluesky, await run("bluesky", () => postToBluesky(posts.bluesky!)));
    }
  }

  // ── Facebook WVW Page ──
  if (platforms.includes("facebook") && posts.facebook) {
    if (!process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
      log("facebook", posts.facebook, { status: "skipped", error: "Facebook not configured" });
    } else {
      log("facebook", posts.facebook, await run("facebook", () => postToFacebook(posts.facebook!)));
    }
  }

  // ── Instagram (Meta Graph API) ──
  if (platforms.includes("instagram") && posts.instagram) {
    if (!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || !process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
      log("instagram", posts.instagram, { status: "skipped", error: "Instagram not configured" });
    } else {
      const imageUrl = `${baseUrl}/api/og?text=${encodeURIComponent(posts.instagram.slice(0, 200))}&theme=${encodeURIComponent(theme)}`;
      log("instagram", posts.instagram, await run("instagram", () => postToInstagram(posts.instagram!, imageUrl)));
    }
  }

  // ── Threads ──
  if (platforms.includes("threads") && posts.threads) {
    if (!process.env.THREADS_ACCESS_TOKEN || !process.env.THREADS_USER_ID) {
      log("threads", posts.threads, { status: "skipped", error: "Threads not configured" });
    } else {
      log("threads", posts.threads, await run("threads", () => postToThreads(posts.threads!)));
    }
  }

  // ── TikTok (Buffer) ──
  if (platforms.includes("tiktok") && posts.tiktok) {
    const profileId = process.env.BUFFER_PROFILE_TIKTOK;
    if (!process.env.BUFFER_ACCESS_TOKEN || !profileId) {
      log("tiktok", posts.tiktok, { status: "skipped", error: "TikTok Buffer not configured" });
    } else {
      log("tiktok", posts.tiktok, await run("tiktok", () => queueInBuffer([profileId], posts.tiktok!)));
    }
  }

  return Response.json({ theme, platforms, results, timestamp: new Date().toISOString() });
}
