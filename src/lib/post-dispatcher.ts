import { postToLinkedIn } from "./linkedin";
import { postToBluesky, postToBlueskyPersonal } from "./bluesky";
import { postToFacebook, postToInstagram, postToThreads } from "./facebook";
import { postToTwitter } from "./twitter";
import { queueInBuffer } from "./buffer";

export async function postToPlatform(platform: string, text: string): Promise<void> {
  switch (platform) {
    case "linkedin_personal": {
      const urn = process.env.LINKEDIN_PERSON_URN;
      if (!urn) throw new Error("LINKEDIN_PERSON_URN not set");
      await postToLinkedIn(text, urn);
      return;
    }
    case "linkedin_wvw": {
      const urn = process.env.LINKEDIN_ORG_URN;
      if (!urn) throw new Error("LINKEDIN_ORG_URN not set");
      await postToLinkedIn(text, urn, true);
      return;
    }
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
      return postToThreads(text);
    case "twitter":
      return postToTwitter(text);
    case "tiktok": {
      const profileId = process.env.BUFFER_PROFILE_TIKTOK;
      if (!process.env.BUFFER_ACCESS_TOKEN || !profileId) throw new Error("TikTok Buffer not configured");
      return queueInBuffer([profileId], text);
    }
    default:
      throw new Error(`Unsupported platform for queue: ${platform}`);
  }
}
