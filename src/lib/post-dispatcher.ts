import { postToBluesky, postToBlueskyPersonal } from "./bluesky";
import { postToFacebook, postToInstagram } from "./facebook";
import { postToTwitter } from "./twitter";
import { queueInBuffer } from "./buffer";

function viaBuffer(envVar: string, label: string, text: string): Promise<void> {
  const profileId = process.env[envVar];
  if (!process.env.BUFFER_ACCESS_TOKEN || !profileId) throw new Error(`${label} Buffer not configured — set BUFFER_ACCESS_TOKEN and ${envVar}`);
  return queueInBuffer([profileId], text);
}

export async function postToPlatform(platform: string, text: string): Promise<void> {
  switch (platform) {
    case "linkedin_personal":
      return viaBuffer("BUFFER_PROFILE_LINKEDIN_PERSONAL", "LinkedIn Personal", text);
    case "linkedin_wvw":
      return viaBuffer("BUFFER_PROFILE_LINKEDIN_WVW", "LinkedIn WVW", text);
    case "bluesky":
      return postToBluesky(text);
    case "bluesky_personal":
      return postToBlueskyPersonal(text);
    case "instagram": {
      // Instagram requires an image URL — text-only posts aren't supported by the API.
      // If text encodes a URL as "IMAGE:https://..." we extract it; otherwise skip gracefully.
      const imgMatch = text.match(/^IMAGE:(https?:\/\/\S+)\n?([\s\S]*)$/);
      if (!imgMatch) throw new Error("Instagram requires an image. Pass content as 'IMAGE:<url>\\n<caption>'.");
      return postToInstagram(imgMatch[2].trim() || text, imgMatch[1]);
    }
    case "facebook":
      return postToFacebook(text);
    case "threads":
      return viaBuffer("BUFFER_PROFILE_THREADS", "Threads", text);
    case "twitter":
      return postToTwitter(text);
    case "tiktok":
      return viaBuffer("BUFFER_PROFILE_TIKTOK", "TikTok", text);
    default:
      throw new Error(`Unsupported platform for queue: ${platform}`);
  }
}
