import { getTodayPlatforms, getTodayTheme, POSTING_SCHEDULE } from "@/lib/schedule";
import { readPostLog } from "@/lib/logger";

export async function GET() {
  const connections = {
    linkedin_token:    !!process.env.LINKEDIN_ACCESS_TOKEN,
    linkedin_person:   !!process.env.LINKEDIN_PERSON_URN,
    linkedin_org:      !!process.env.LINKEDIN_ORG_URN,
    twitter:           !!(process.env.TWITTER_API_KEY && process.env.TWITTER_ACCESS_TOKEN),
    bluesky:           !!(process.env.BLUESKY_IDENTIFIER && process.env.BLUESKY_APP_PASSWORD),
    bluesky_personal:  !!(process.env.BLUESKY_PERSONAL_IDENTIFIER && process.env.BLUESKY_PERSONAL_APP_PASSWORD),
    facebook:          !!(process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID),
    instagram:         !!(process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID),
    threads:           !!(process.env.THREADS_ACCESS_TOKEN && process.env.THREADS_USER_ID),
    tiktok_buffer:     !!(process.env.BUFFER_ACCESS_TOKEN && process.env.BUFFER_PROFILE_TIKTOK),
  };

  return Response.json({
    connections,
    todayPlatforms: getTodayPlatforms(),
    todayTheme: getTodayTheme(),
    schedule: POSTING_SCHEDULE,
    recentPosts: readPostLog().slice(0, 15),
  });
}
