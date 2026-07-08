import { NextRequest } from "next/server";
import { generateWisdoms } from "@/lib/generate-posts";
import { postToFacebook } from "@/lib/facebook";
import { postToBluesky, postToBlueskyPersonal } from "@/lib/bluesky";
import { queueInBuffer } from "@/lib/buffer";
import { appendPostLog } from "@/lib/logger";
import { sendCronSummary } from "@/lib/notify";

export const runtime = 'edge';

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

type Result = { status: string; error?: string };

async function run(fn: () => Promise<unknown>): Promise<Result> {
  try { await fn(); return { status: "posted" }; }
  catch (err) { return { status: "error", error: String(err) }; }
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let wisdoms: string[];
  try {
    wisdoms = await generateWisdoms(1);
  } catch (err) {
    return Response.json({ error: "Generation failed", detail: String(err) }, { status: 500 });
  }

  const wisdom = wisdoms[0];
  if (!wisdom) return Response.json({ error: "No wisdom generated" }, { status: 500 });

  const results: Record<string, Result> = {};

  // ── LinkedIn Personal (Buffer) ──
  const personProfile = process.env.BUFFER_PROFILE_LINKEDIN_PERSONAL;
  if (process.env.BUFFER_ACCESS_TOKEN && personProfile) {
    results.linkedin_personal = await run(() => queueInBuffer([personProfile], wisdom));
  } else {
    results.linkedin_personal = { status: "skipped", error: "LinkedIn Personal Buffer not configured" };
  }

  // ── LinkedIn WVW Page (Buffer) ──
  const orgProfile = process.env.BUFFER_PROFILE_LINKEDIN_WVW;
  if (process.env.BUFFER_ACCESS_TOKEN && orgProfile) {
    results.linkedin_wvw = await run(() => queueInBuffer([orgProfile], wisdom));
  } else {
    results.linkedin_wvw = { status: "skipped", error: "LinkedIn WVW Buffer not configured" };
  }

  // ── Facebook WVW Page ──
  if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID) {
    results.facebook = await run(() => postToFacebook(wisdom));
  } else {
    results.facebook = { status: "skipped", error: "Facebook not configured" };
  }

  // ── Threads (Buffer) ──
  const threadsProfile = process.env.BUFFER_PROFILE_THREADS;
  if (process.env.BUFFER_ACCESS_TOKEN && threadsProfile) {
    results.threads = await run(() => queueInBuffer([threadsProfile], wisdom));
  } else {
    results.threads = { status: "skipped", error: "Threads Buffer not configured" };
  }

  // ── Bluesky WVW ──
  if (process.env.BLUESKY_IDENTIFIER && process.env.BLUESKY_APP_PASSWORD) {
    results.bluesky_wvw = await run(() => postToBluesky(wisdom));
  } else {
    results.bluesky_wvw = { status: "skipped", error: "Bluesky WVW not configured" };
  }

  // ── Bluesky Personal ──
  if (process.env.BLUESKY_PERSONAL_IDENTIFIER && process.env.BLUESKY_PERSONAL_APP_PASSWORD) {
    results.bluesky_personal = await run(() => postToBlueskyPersonal(wisdom));
  } else {
    results.bluesky_personal = { status: "skipped", error: "Personal Bluesky not configured" };
  }

  Object.entries(results).forEach(([platform, r]) => {
    void appendPostLog({ platform, theme: "Unicorn Wisdom", text: wisdom, status: r.status as "posted" | "queued" | "error" | "skipped", error_detail: r.error });
  });

  void sendCronSummary("Unicorn Wisdom", "Unicorn Wisdom", results);
  return Response.json({ wisdom, results, timestamp: new Date().toISOString() });
}
