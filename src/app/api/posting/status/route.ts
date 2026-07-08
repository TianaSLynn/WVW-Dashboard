import { getTodayPlatforms, getTodayTheme, POSTING_SCHEDULE } from "@/lib/schedule";
import { readPostLog } from "@/lib/logger";

export async function GET() {
  const connections = {
    anthropic_key:     !!process.env.ANTHROPIC_API_KEY,
    linkedin_personal_buffer: !!(process.env.BUFFER_ACCESS_TOKEN && process.env.BUFFER_PROFILE_LINKEDIN_PERSONAL),
    linkedin_wvw_buffer:      !!(process.env.BUFFER_ACCESS_TOKEN && process.env.BUFFER_PROFILE_LINKEDIN_WVW),
    bluesky:           !!(process.env.BLUESKY_IDENTIFIER && process.env.BLUESKY_APP_PASSWORD),
    bluesky_personal:  !!(process.env.BLUESKY_PERSONAL_IDENTIFIER && process.env.BLUESKY_PERSONAL_APP_PASSWORD),
    facebook:          !!(process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID),
    instagram:         !!(process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID),
    threads_buffer:    !!(process.env.BUFFER_ACCESS_TOKEN && process.env.BUFFER_PROFILE_THREADS),
    tiktok_buffer:     !!(process.env.BUFFER_ACCESS_TOKEN && process.env.BUFFER_PROFILE_TIKTOK),
  };

  let recentPosts: Awaited<ReturnType<typeof readPostLog>> = [];
  try {
    recentPosts = (await readPostLog()).slice(0, 15);
  } catch {
    // Supabase unavailable — return empty log, don't crash connections check
  }

  return Response.json(
    {
      connections,
      todayPlatforms: getTodayPlatforms(),
      todayTheme: getTodayTheme(),
      schedule: POSTING_SCHEDULE,
      recentPosts,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        // Explicitly bust Vercel's edge cache — prevents the 4+ day CDN cache issue
        "CDN-Cache-Control": "no-store",
        "Surrogate-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    }
  );
}
