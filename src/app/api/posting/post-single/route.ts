import { NextRequest } from "next/server";
import { postToLinkedIn } from "@/lib/linkedin";
import { postToFacebook, postToThreads } from "@/lib/facebook";
import { postToBluesky, postToBlueskyPersonal } from "@/lib/bluesky";
import { appendPostLog } from "@/lib/logger";

export const maxDuration = 60;

// Posts a single already-generated text to a single platform.
// Used by the Generate & Preview panel — text is pre-generated and reviewed before this is called.
export async function POST(req: NextRequest) {
  const { platform, text, theme } = await req.json() as { platform: string; text: string; theme?: string };

  if (!platform || !text) {
    return Response.json({ error: "platform and text required" }, { status: 400 });
  }

  let status = "error";
  let error: string | undefined;

  try {
    switch (platform) {
      case "linkedin_personal": {
        const urn = process.env.LINKEDIN_PERSON_URN;
        if (!process.env.LINKEDIN_ACCESS_TOKEN || !urn) throw new Error("LinkedIn Personal not configured");
        await postToLinkedIn(text, urn);
        break;
      }
      case "linkedin_wvw": {
        const urn = process.env.LINKEDIN_ORG_URN;
        if (!process.env.LINKEDIN_ACCESS_TOKEN || !urn) throw new Error("LinkedIn WVW not configured");
        await postToLinkedIn(text, urn);
        break;
      }
      case "facebook":
        if (!process.env.FACEBOOK_PAGE_ACCESS_TOKEN || !process.env.FACEBOOK_PAGE_ID) throw new Error("Facebook not configured");
        await postToFacebook(text);
        break;
      case "threads":
        if (!process.env.THREADS_ACCESS_TOKEN || !process.env.THREADS_USER_ID) throw new Error("Threads not configured");
        await postToThreads(text);
        break;
      case "bluesky":
        if (!process.env.BLUESKY_IDENTIFIER || !process.env.BLUESKY_APP_PASSWORD) throw new Error("Bluesky not configured");
        await postToBluesky(text);
        break;
      case "bluesky_personal":
        if (!process.env.BLUESKY_PERSONAL_IDENTIFIER || !process.env.BLUESKY_PERSONAL_APP_PASSWORD) throw new Error("Bluesky Personal not configured");
        await postToBlueskyPersonal(text);
        break;
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
    status = "posted";
  } catch (err) {
    error = String(err);
  }

  void appendPostLog({
    platform,
    theme: theme ?? "Manual Preview Post",
    text,
    status: status as "posted" | "error",
  });

  return Response.json({ platform, status, error });
}
