import { NextRequest } from "next/server";
import { postToBluesky, postToBlueskyPersonal } from "@/lib/bluesky";
import { postToThreads } from "@/lib/facebook";
import { postToLinkedIn } from "@/lib/linkedin";

export const maxDuration = 30;

const TEST_MESSAGE = "✓ WVW system check — this is a test post from the WVW Intelligence Platform. Ignore.";

type Platform =
  | "threads"
  | "bluesky"
  | "bluesky_personal"
  | "linkedin_personal"
  | "linkedin_wvw";

const ENV_REQUIRED: Record<Platform, string[]> = {
  threads: ["THREADS_ACCESS_TOKEN", "THREADS_USER_ID"],
  bluesky: ["BLUESKY_IDENTIFIER", "BLUESKY_APP_PASSWORD"],
  bluesky_personal: ["BLUESKY_PERSONAL_IDENTIFIER", "BLUESKY_PERSONAL_APP_PASSWORD"],
  linkedin_personal: ["LINKEDIN_ACCESS_TOKEN", "LINKEDIN_PERSON_URN"],
  linkedin_wvw: ["LINKEDIN_ORG_ACCESS_TOKEN", "LINKEDIN_ORG_URN"],
};

async function runPost(platform: Platform): Promise<void> {
  switch (platform) {
    case "threads":
      await postToThreads(TEST_MESSAGE);
      break;
    case "bluesky":
      await postToBluesky(TEST_MESSAGE);
      break;
    case "bluesky_personal":
      await postToBlueskyPersonal(TEST_MESSAGE);
      break;
    case "linkedin_personal": {
      const urn = process.env.LINKEDIN_PERSON_URN!;
      await postToLinkedIn(TEST_MESSAGE, urn);
      break;
    }
    case "linkedin_wvw": {
      const orgUrn = process.env.LINKEDIN_ORG_URN!;
      const token = process.env.LINKEDIN_ORG_ACCESS_TOKEN!;
      const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: orgUrn,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: TEST_MESSAGE },
              shareMediaCategory: "NONE",
            },
          },
          visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        }),
      });
      if (!res.ok) throw new Error(`LinkedIn Org ${res.status}: ${await res.text()}`);
      break;
    }
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
