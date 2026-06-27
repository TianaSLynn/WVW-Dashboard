import { NextRequest } from "next/server";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET ?? "";
  const origin = new URL(req.url).origin;

  const res = await fetch(`${origin}/api/cron/wisdom`, {
    headers: { authorization: `Bearer ${secret}` },
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
