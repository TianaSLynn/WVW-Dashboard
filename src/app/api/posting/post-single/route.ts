import { NextRequest } from "next/server";
import { postToFacebook } from "@/lib/facebook";
import { postToBluesky, postToBlueskyPersonal } from "@/lib/bluesky";
import { postToTwitter } from "@/lib/twitter";
import { queueInBuffer } from "@/lib/buffer";
import { appendPostLog } from "@/lib/logger";

function viaBuffer(envVar: string, label: string, text: string): Promise<void> {
  const profileId = process.env[envVar];
  if (!process.env.BUFFER_ACCESS_TOKEN || !profileId) throw new Error(`${label} not configured — add BUFFER_ACCESS_TOKEN and ${envVar} to Vercel`);
  return queueInBuffer([profileId], text);
}

export const runtime = 'edge';

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
      case "linkedin_personal":
        await viaBuffer("BUFFER_PROFILE_LINKEDIN_PERSONAL", "LinkedIn Personal", text);
        break;
      case "linkedin_wvw":
        await viaBuffer("BUFFER_PROFILE_LINKEDIN_WVW", "LinkedIn WVW", text);
        break;
      case "facebook":
        if (!process.env.FACEBOOK_PAGE_ACCESS_TOKEN || !process.env.FACEBOOK_PAGE_ID) throw new Error("Facebook not configured");
        await postToFacebook(text);
        break;
      case "threads":
        await viaBuffer("BUFFER_PROFILE_THREADS", "Threads", text);
        break;
      case "bluesky":
        if (!process.env.BLUESKY_IDENTIFIER || !process.env.BLUESKY_APP_PASSWORD) throw new Error("Bluesky not configured");
        await postToBluesky(text);
        break;
      case "bluesky_personal":
        if (!process.env.BLUESKY_PERSONAL_IDENTIFIER || !process.env.BLUESKY_PERSONAL_APP_PASSWORD) throw new Error("Bluesky Personal not configured");
        await postToBlueskyPersonal(text);
        break;
      case "twitter":
        if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_ACCESS_TOKEN) throw new Error("Twitter not configured — add TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET to Vercel");
        await postToTwitter(text);
        break;
      case "tiktok":
        await viaBuffer("BUFFER_PROFILE_TIKTOK", "TikTok", text);
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
    error_detail: error,
  });

  return Response.json({ platform, status, error });
}
