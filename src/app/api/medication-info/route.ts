import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

const client = new Anthropic();

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.trim();
  if (!name || name.length < 2) {
    return Response.json({ error: "name required" }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `You are a helpful medication reference assistant. The user typed "${name}" as a medication name.

Return ONLY valid JSON (no markdown, no explanation) in this exact shape:
{
  "normalizedName": "exact medication name",
  "commonBrands": ["brand1", "brand2"],
  "commonDoses": ["dose1", "dose2", "dose3"],
  "whenToTake": "e.g. Morning with food, or At bedtime",
  "frequency": "daily",
  "symptomsToTrack": ["symptom1", "symptom2", "symptom3", "symptom4", "symptom5"],
  "notes": "One sentence of helpful context for the patient",
  "found": true
}

If the name doesn't match any real medication, return { "found": false }.
Only include symptomsToTrack that are genuinely common for this medication — be accurate.
Keep symptomsToTrack to 6 items max. Keep commonDoses to 4 items max.`,
        },
      ],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return Response.json({ found: false });
    const json = JSON.parse(match[0]);
    return Response.json(json);
  } catch {
    return Response.json({ found: false });
  }
}
