export default async () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wvw-command.netlify.app";
  const secret = process.env.CRON_SECRET;
  const res = await fetch(`${siteUrl}/api/cron/bluesky?slot=3`, {
    headers: { authorization: `Bearer ${secret}` },
  });
  return new Response(res.ok ? "ok" : "failed", { status: res.ok ? 200 : 500 });
};

export const config = { schedule: "0 16 * * *" };
