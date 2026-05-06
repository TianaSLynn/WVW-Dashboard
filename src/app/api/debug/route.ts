export async function GET() {
  const keys = [
    "ANTHROPIC_API_KEY",
    "LINKEDIN_CLIENT_ID",
    "LINKEDIN_ACCESS_TOKEN",
    "LINKEDIN_PERSON_URN",
    "LINKEDIN_ORG_URN",
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
    "THREADS_ACCESS_TOKEN",
    "THREADS_USER_ID",
    "BUFFER_ACCESS_TOKEN",
    "BUFFER_PROFILE_TIKTOK",
    "BEEHIIV_API_KEY",
    "BEEHIIV_PUBLICATION_ID",
  ];

  const result = Object.fromEntries(
    keys.map((k) => [k, !!process.env[k]])
  );

  return Response.json(result);
}
