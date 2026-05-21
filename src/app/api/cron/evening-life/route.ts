import { NextRequest } from "next/server";
import { buildAndSendEvening } from "@/lib/evening-briefing";

export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await buildAndSendEvening();
    return Response.json(result);
  } catch (err) {
    console.error("[evening-life] failed:", String(err));
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
