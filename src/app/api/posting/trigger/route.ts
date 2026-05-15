import { NextRequest } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET ?? "";
  const origin = new URL(req.url).origin;

  const body = await req.json().catch(() => ({})) as { platforms?: string[] };
  const platformParam = body.platforms?.length
    ? `?platforms=${encodeURIComponent(body.platforms.join(","))}`
    : "";

  const res = await fetch(`${origin}/api/cron/daily${platformParam}`, {
    headers: { authorization: `Bearer ${secret}` },
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
