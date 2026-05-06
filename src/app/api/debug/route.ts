export async function GET() {
  const keys = [
    "ANTHROPIC_API_KEY",
    "LINKEDIN_CLIENT_ID",
    "LINKEDIN_ACCESS_TOKEN",
    "LINKEDIN_PERSON_URN",
    "LINKEDIN_ORG_URN",
    "CRON_SECRET",
  ];

  const result = Object.fromEntries(
    keys.map((k) => [k, !!process.env[k]])
  );

  return Response.json(result);
}
