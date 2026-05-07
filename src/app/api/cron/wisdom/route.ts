import { NextRequest } from "next/server";
import { generateWisdoms } from "@/lib/generate-posts";
import { postToLinkedIn } from "@/lib/linkedin";
import { postToFacebook, postToThreads } from "@/lib/facebook";
import { postToBluesky, postToBlueskyPersonal } from "@/lib/bluesky";
import { appendPostLog } from "@/lib/logger";

export const maxDuration = 60;

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

  // ── LinkedIn Personal ──
  const personUrn = process.env.LINKEDIN_PERSON_URN;
  if (process.env.LINKEDIN_ACCESS_TOKEN && personUrn) {
    results.linkedin_personal = await run(() => postToLinkedIn(wisdom, personUrn));
  } else {
    results.linkedin_personal = { status: "skipped", error: "LinkedIn not configured" };
  }

  // ── LinkedIn WVW Page ──
  const orgUrn = process.env.LINKEDIN_ORG_URN;
  if (process.env.LINKEDIN_ACCESS_TOKEN && orgUrn) {
    results.linkedin_wvw = await run(() => postToLinkedIn(wisdom, orgUrn));
  } else {
    results.linkedin_wvw = { status: "skipped", error: "LinkedIn WVW not configured" };
  }

  // ── Facebook WVW Page ──
  if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID) {
    results.facebook = await run(() => postToFacebook(wisdom));
  } else {
    results.facebook = { status: "skipped", error: "Facebook not configured" };
  }

  // ── Threads ──
  if (process.env.THREADS_ACCESS_TOKEN && process.env.THREADS_USER_ID) {
    results.threads = await run(() => postToThreads(wisdom));
  } else {
    results.threads = { status: "skipped", error: "Threads not configured" };
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
    void appendPostLog({ platform, theme: "Unicorn Wisdom", text: wisdom, status: r.status as "posted" | "queued" | "error" | "skipped" });
  });

  return Response.json({ wisdom, results, timestamp: new Date().toISOString() });
}
