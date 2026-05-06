import { NextRequest } from "next/server";
import { getTodayPlatforms, getTodayTheme } from "@/lib/schedule";
import type { Platform } from "@/lib/schedule";
import { generateDailyPosts } from "@/lib/generate-posts";
import { postToLinkedIn } from "@/lib/linkedin";
import { queueInBuffer } from "@/lib/buffer";
import { appendPostLog } from "@/lib/logger";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
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

  const results: Record<string, { status: string; error?: string }> = {};

  // LinkedIn — direct API
  const linkedInPlatforms: Platform[] = ["linkedin_personal", "linkedin_wvw"];
  for (const platform of linkedInPlatforms) {
    if (!platforms.includes(platform)) continue;
    const text = posts[platform];
    if (!text) continue;

    const urn =
      platform === "linkedin_personal"
        ? process.env.LINKEDIN_PERSON_URN
        : process.env.LINKEDIN_ORG_URN;

    if (!urn) {
      results[platform] = { status: "skipped", error: "URN not configured" };
      continue;
    }

    try {
      await postToLinkedIn(text, urn);
      results[platform] = { status: "posted" };
      appendPostLog({ platform, theme, text, status: "posted" });
    } catch (err) {
      results[platform] = { status: "error", error: String(err) };
      appendPostLog({ platform, theme, text, status: "error" });
    }
  }

  // Buffer — Instagram, TikTok, Threads
  const bufferMap: Partial<Record<Platform, string | undefined>> = {
    instagram: process.env.BUFFER_PROFILE_INSTAGRAM,
    tiktok: process.env.BUFFER_PROFILE_TIKTOK,
    threads: process.env.BUFFER_PROFILE_THREADS,
  };

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://wvw-dashboard.vercel.app";

  for (const [platform, profileId] of Object.entries(bufferMap) as [Platform, string | undefined][]) {
    if (!platforms.includes(platform)) continue;
    const text = posts[platform];

    if (!text || !profileId) {
      results[platform] = {
        status: "skipped",
        error: profileId ? "no content generated" : "Buffer profile ID not configured",
      };
      continue;
    }

    // Instagram gets a branded OG image card
    const imageUrl = platform === "instagram"
      ? `${baseUrl}/api/og?text=${encodeURIComponent(text.slice(0, 200))}&theme=${encodeURIComponent(theme)}`
      : undefined;

    try {
      await queueInBuffer([profileId], text, imageUrl);
      results[platform] = { status: "queued" };
      appendPostLog({ platform, theme, text, status: "queued" });
    } catch (err) {
      results[platform] = { status: "error", error: String(err) };
      appendPostLog({ platform, theme, text, status: "error" });
    }
  }

  return Response.json({
    theme,
    platforms,
    results,
    timestamp: new Date().toISOString(),
  });
}
