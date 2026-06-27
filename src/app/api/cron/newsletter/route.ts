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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wvw-command.netlify.app";

  const res = await fetch(`${baseUrl}/api/newsletter/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ series, theme }),
  });

  // newsletter/create streams text/plain — buffer the full response
  const text = await res.text();
  const excerpt = text.slice(0, 200).replace(/\n/g, " ").trim();

  return Response.json({
    series,
    theme,
    day,
    generated: true,
    excerpt,
    length: text.length,
    timestamp: new Date().toISOString(),
  });
}
