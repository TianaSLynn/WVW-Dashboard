import { NextRequest } from "next/server";
import { postToBluesky, postToBlueskyPersonal } from "@/lib/bluesky";
import { queueInBuffer } from "@/lib/buffer";

export const runtime = 'edge';

const TEST_MESSAGE = "✓ WVW system check — this is a test post from the WVW Intelligence Platform. Ignore.";

type Platform =
  | "threads"
  | "bluesky"
  | "bluesky_personal"
  | "linkedin_personal"
  | "linkedin_wvw";

const ENV_REQUIRED: Record<Platform, string[]> = {
  threads: ["BUFFER_ACCESS_TOKEN", "BUFFER_PROFILE_THREADS"],
  bluesky: ["BLUESKY_IDENTIFIER", "BLUESKY_APP_PASSWORD"],
  bluesky_personal: ["BLUESKY_PERSONAL_IDENTIFIER", "BLUESKY_PERSONAL_APP_PASSWORD"],
  linkedin_personal: ["BUFFER_ACCESS_TOKEN", "BUFFER_PROFILE_LINKEDIN_PERSONAL"],
  linkedin_wvw: ["BUFFER_ACCESS_TOKEN", "BUFFER_PROFILE_LINKEDIN_WVW"],
};

async function runPost(platform: Platform): Promise<void> {
  switch (platform) {
    case "threads":
      await queueInBuffer([process.env.BUFFER_PROFILE_THREADS!], TEST_MESSAGE);
      break;
    case "bluesky":
      await postToBluesky(TEST_MESSAGE);
      break;
    case "bluesky_personal":
      await postToBlueskyPersonal(TEST_MESSAGE);
      break;
    case "linkedin_personal":
      await queueInBuffer([process.env.BUFFER_PROFILE_LINKEDIN_PERSONAL!], TEST_MESSAGE);
      break;
    case "linkedin_wvw":
      await queueInBuffer([process.env.BUFFER_PROFILE_LINKEDIN_WVW!], TEST_MESSAGE);
      break;
  }
}

export async function POST(req: NextRequest) {
  let platform: string;
  try {
    const body = await req.json() as { platform?: string };
    platform = body.platform ?? "";
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validPlatforms = Object.keys(ENV_REQUIRED) as Platform[];
  if (!platform || !validPlatforms.includes(platform as Platform)) {
    return Response.json(
      { error: `Unknown platform. Valid: ${validPlatforms.join(", ")}` },
      { status: 400 }
    );
  }

  const p = platform as Platform;
  const missing = ENV_REQUIRED[p].filter((v) => !process.env[v]);
  if (missing.length > 0) {
    return Response.json(
      { status: "skipped", reason: `Missing env vars: ${missing.join(", ")}` },
      { status: 200 }
    );
  }

  try {
    await runPost(p);
    return Response.json({ status: "posted", platform, message: TEST_MESSAGE });
  } catch (err) {
    return Response.json({ status: "error", platform, error: String(err) }, { status: 500 });
  }
}
