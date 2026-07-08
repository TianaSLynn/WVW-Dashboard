import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { BRAND_VOICE } from "@/lib/brand-voice";

export const runtime = 'edge';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `${BRAND_VOICE}

WVW has two distinct brands — know the difference:

WVW CONSULTING (primary brand): B2B organizational consulting practice. Clients: HR leaders, operations executives, nonprofit directors, government agencies, CHW program managers, C-suite leaders. Work: organizational systems design, burnout prevention, psychological safety, CHW structural care audits, culture audits, leadership alignment.

WVW ACADEMY / WVWA (education brand): Direct-to-professional digital education platform. Audience: HR professionals, consultants, coaches, CHW supervisors, organizational leaders seeking self-paced growth. Offers: courses, masterclasses, certifications, toolkits, cohorts.

NAMED FRAMEWORKS AND SERIES:
- "Unicorn Wisdoms" — signature insight series (brief, potent, aphoristic)
- "The Weight We Carry" — content about invisible labor and moral exhaustion
- "Ease, Power, Blackness" — newsletter series on thriving as a Black professional/leader
- "Black Excellence Reimagined" — evening content reframing Black excellence beyond performance
- "Moral Exhaustion" — the specific burnout from working in misaligned systems (preferred over "burnout" alone)
- "Systems Design" — intentional construction of organizational culture and process
- "The Brief" — newsletter series (Fridays) with sharp, actionable takes

TEN CONTENT PILLARS:
1. Moral Exhaustion & Burnout Prevention
2. Invisible Labor
3. Neurodivergence at Work
4. Black Identity in Professional Spaces
5. CHW Structural Care
6. Organizational Systems Design
7. Rest as Strategy
8. Psychological Safety
9. Leadership Alignment
10. WVW Academy

NEWSLETTER SERIES (M/W/F, rotating):
- Monday: "Ease, Power, Blackness"
- Wednesday: "Black Excellence Reimagined"
- Friday: "The Brief"

Produce content that sounds like Tiána Lynn — grounded, precise, unhurried, authoritative. Every angle must be WVW-branded and specific, never generic.`;

export async function POST(req: NextRequest) {
  const { month } = await req.json() as { month?: string };
  const monthLabel = month ?? new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  const prompt = `Build a full content month plan for WVW for ${monthLabel}.

Return ONLY valid JSON — no markdown fences, no preamble, no explanation. Start directly with {

{
  "month": "${monthLabel}",
  "focus": "One overarching monthly theme sentence",
  "weeks": [
    {
      "week": 1,
      "dates": "May 1–7",
      "theme": "Weekly theme name",
      "pillar": "Content pillar",
      "intent": "Strategic intent sentence",
      "posts": [
        { "day": "Monday", "platform": "LinkedIn Personal", "format": "Essay hook", "angle": "Specific angle" },
        { "day": "Tuesday", "platform": "Instagram", "format": "Carousel", "angle": "Specific angle" },
        { "day": "Wednesday", "platform": "LinkedIn WVW", "format": "Short post", "angle": "Specific angle" },
        { "day": "Wednesday", "platform": "Threads", "format": "Thread", "angle": "Specific angle" },
        { "day": "Thursday", "platform": "Twitter", "format": "Short post", "angle": "Specific angle" },
        { "day": "Friday", "platform": "Facebook", "format": "Post", "angle": "Specific angle" },
        { "day": "Friday", "platform": "Bluesky", "format": "Short post", "angle": "Specific angle" }
      ]
    }
  ],
  "newsletterPlan": [
    { "date": "May 5 (Mon)", "series": "Ease, Power, Blackness", "theme": "..." },
    { "date": "May 7 (Wed)", "series": "Black Excellence", "theme": "..." },
    { "date": "May 9 (Fri)", "series": "The Brief", "theme": "..." }
  ],
  "repurposeMap": [
    { "source": "Week 1 LinkedIn essay", "repurpose": ["IG carousel", "Threads thread", "Substack section"] }
  ]
}

Produce 4 complete weeks. Each week must have 6–8 posts across LinkedIn Personal, LinkedIn WVW, Instagram, Threads, Twitter, Facebook, Bluesky. Make angles specific and WVW-branded — never generic.`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return Response.json({ error: "Generation failed" }, { status: 500 });

  try {
    const plan = JSON.parse(match[0]);
    return Response.json(plan);
  } catch {
    return Response.json({ error: "JSON parse failed", raw: raw.slice(0, 500) }, { status: 500 });
  }
}
