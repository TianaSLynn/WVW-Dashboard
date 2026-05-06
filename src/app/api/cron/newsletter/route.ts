import { NextRequest } from "next/server";
import { getTodayTheme } from "@/lib/schedule";

const SERIES_BY_DAY: Record<number, string> = {
  1: "Ease, Power, Blackness", // Monday
  3: "Black Excellence",       // Wednesday
  5: "The Brief",              // Friday
};

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const day = new Date().getDay();
  const series = SERIES_BY_DAY[day];

  if (!series) {
    return Response.json({ message: "No newsletter scheduled today", day });
  }

  const theme = getTodayTheme();
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://wvw-dashboard.vercel.app";

  const res = await fetch(`${baseUrl}/api/newsletter/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ series, theme }),
  });

  const data = await res.json();

  return Response.json({
    series,
    theme,
    day,
    result: data,
    timestamp: new Date().toISOString(),
  });
}
