import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET ?? "";
  const origin = new URL(req.url).origin;
  const res = await fetch(`${origin}/api/cron/black-excellence`, {
    headers: { authorization: `Bearer ${secret}` },
  });
  return Response.json(await res.json(), { status: res.status });
}
