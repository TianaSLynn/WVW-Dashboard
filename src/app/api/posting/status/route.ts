import { getTodayPlatforms, getTodayTheme, POSTING_SCHEDULE } from "@/lib/schedule";
import { readPostLog } from "@/lib/logger";

export async function GET() {
  const connections = {
    linkedin_token: !!process.env.LINKEDIN_ACCESS_TOKEN,
    linkedin_person: !!process.env.LINKEDIN_PERSON_URN,
    linkedin_org: !!process.env.LINKEDIN_ORG_URN,
    buffer_token: !!process.env.BUFFER_ACCESS_TOKEN,
    buffer_instagram: !!process.env.BUFFER_PROFILE_INSTAGRAM,
    buffer_tiktok: !!process.env.BUFFER_PROFILE_TIKTOK,
    buffer_threads: !!process.env.BUFFER_PROFILE_THREADS,
  };

  return Response.json({
    connections,
    todayPlatforms: getTodayPlatforms(),
    todayTheme: getTodayTheme(),
    schedule: POSTING_SCHEDULE,
    recentPosts: readPostLog().slice(0, 15),
  });
}
