import { NextRequest } from "next/server";

export const runtime = 'edge';

import { generateBlueskySlot } from "@/lib/generate-posts";
import { getSlotTheme } from "@/lib/schedule";
import { postToBluesky, postToBlueskyPersonal } from "@/lib/bluesky";
import { appendPostLog } from "@/lib/logger";
import { sendCronSummary } from "@/lib/notify";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

type Result = { status: string; error?: string };

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slotParam = new URL(req.url).searchParams.get("slot");
  const slot = Math.max(1, Math.min(8, parseInt(slotParam ?? "1", 10)));
  const theme = getSlotTheme(slot);

  let posts: { bluesky: string; bluesky_personal: string };
  try {
    posts = await generateBlueskySlot(theme, slot);
  } catch (err) {
    return Response.json({ error: "Generation failed", detail: String(err) }, { status: 500 });
  }

  const results: Record<string, Result> = {};

  if (process.env.BLUESKY_IDENTIFIER) {
    try {
      await postToBluesky(posts.bluesky);
      results.bluesky = { status: "posted" };
    } catch (err) {
      results.bluesky = { status: "error", error: String(err) };
    }
    void appendPostLog({
      platform: "bluesky",
      theme,
      text: posts.bluesky,
      status: results.bluesky.status as "posted" | "error",
      error_detail: results.bluesky.error,
    });
  } else {
    results.bluesky = { status: "skipped", error: "BLUESKY_IDENTIFIER not set" };
  }

  if (process.env.BLUESKY_PERSONAL_IDENTIFIER) {
    try {
      await postToBlueskyPersonal(posts.bluesky_personal);
      results.bluesky_personal = { status: "posted" };
    } catch (err) {
      results.bluesky_personal = { status: "error", error: String(err) };
    }
    void appendPostLog({
      platform: "bluesky_personal",
      theme,
      text: posts.bluesky_personal,
      status: results.bluesky_personal.status as "posted" | "error",
      error_detail: results.bluesky_personal.error,
    });
  } else {
    results.bluesky_personal = { status: "skipped", error: "BLUESKY_PERSONAL_IDENTIFIER not set" };
  }

  void sendCronSummary(`Bluesky Slot ${slot}`, theme, results);
  return Response.json({ theme, slot, results, timestamp: new Date().toISOString() });
}
