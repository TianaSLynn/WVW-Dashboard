import { NextRequest } from "next/server";
import { generateWisdoms } from "@/lib/generate-posts";
import { queueInBuffer } from "@/lib/buffer";
import { appendPostLog } from "@/lib/logger";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let wisdoms: string[];
  try {
    wisdoms = await generateWisdoms(5);
  } catch (err) {
    return Response.json({ error: "Generation failed", detail: String(err) }, { status: 500 });
  }

  const profileIds = [
    process.env.BUFFER_PROFILE_INSTAGRAM,
    process.env.BUFFER_PROFILE_THREADS,
  ].filter(Boolean) as string[];

  const results: string[] = [];

  for (const wisdom of wisdoms) {
    try {
      if (profileIds.length > 0) {
        await queueInBuffer(profileIds, wisdom);
      }
      appendPostLog({ platform: "buffer", theme: "Unicorn Wisdoms", text: wisdom, status: "queued" });
      results.push("queued");
    } catch {
      results.push("error");
    }
  }

  return Response.json({ wisdoms, results, timestamp: new Date().toISOString() });
}
