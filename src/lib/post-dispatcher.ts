import { postToLinkedIn } from "./linkedin";
import { postToBluesky, postToBlueskyPersonal } from "./bluesky";
import { postToFacebook, postToThreads } from "./facebook";

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
      await postToLinkedIn(text, urn);
      return;
    }
    case "bluesky":
      return postToBluesky(text);
    case "bluesky_personal":
      return postToBlueskyPersonal(text);
    case "facebook":
      return postToFacebook(text);
    case "threads":
      return postToThreads(text);
    default:
      throw new Error(`Unsupported platform for queue: ${platform}`);
  }
}
