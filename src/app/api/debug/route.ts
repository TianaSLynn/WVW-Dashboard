export async function GET() {
  const keys = [
    "ANTHROPIC_API_KEY",
    "CRON_SECRET",
    "TWITTER_API_KEY",
    "TWITTER_API_SECRET",
    "TWITTER_ACCESS_TOKEN",
    "TWITTER_ACCESS_SECRET",
    "BLUESKY_IDENTIFIER",
    "BLUESKY_APP_PASSWORD",
    "FACEBOOK_PAGE_ACCESS_TOKEN",
    "FACEBOOK_PAGE_ID",
    "INSTAGRAM_BUSINESS_ACCOUNT_ID",
    "BUFFER_ACCESS_TOKEN",
    "BUFFER_PROFILE_TIKTOK",
    "BUFFER_PROFILE_THREADS",
    "BUFFER_PROFILE_LINKEDIN_PERSONAL",
    "BUFFER_PROFILE_LINKEDIN_WVW",
    "BEEHIIV_API_KEY",
    "BEEHIIV_PUBLICATION_ID",
  ];

  const result = Object.fromEntries(
    keys.map((k) => [k, !!process.env[k]])
  );

  return Response.json(result);
}
