import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the content strategist for Wholistic Vibes Wellness (WVW), a Black-led B2B organizational consulting practice founded by Tiána Lynn.

Brand voice: calm, grounded, structural, powerful, intentional, luxury positioning.
Never: influencer energy, hollow affirmations, performative empathy, fluff, generic content, over-explaining.
Core line: "Soft in appearance. Uncompromising in practice."
Audience: HR leaders, operations executives, nonprofit directors, Black professionals, neurodivergent practitioners.
Themes: burnout/moral injury, invisible labor, neurodivergence at work, Black identity in professional spaces, organizational systems design, rest as strategy, psychological safety.`;

const FORMAT_PROMPTS: Record<string, string> = {
  "Turn into newsletter": `Write a full newsletter issue based on this post's theme.

Structure:
SUBJECT: [compelling subject line]
PREVIEW: [1 sentence preview text]

---

[Opening paragraph: 2–3 sentences, personal entry point]
[Body: 3–5 paragraphs — structural insight, lived truth, systems analysis]
[Close: 1 paragraph — grounded, not inspirational bypassing]

With care and precision,
Tiána`,

  "Turn into carousel": `Create an Instagram/LinkedIn carousel outline.

Structure:
COVER: [hook or structural truth — 1 sentence, bold and clear]
SLIDE 2: [reframe — why this matters]
SLIDE 3: [the pattern — what's actually happening]
SLIDE 4: [the shift — what changes when you see it clearly]
SLIDE 5: [the system — name it specifically]
SLIDE 6: [close + CTA — "Save this." or "Share with your team."]

CAPTION: [100–150 word Instagram/LinkedIn caption for the post]
HASHTAGS: [3–5 relevant hashtags]`,

  "Turn into podcast segment": `Write a podcast segment opening for this theme.

Structure:
EPISODE TITLE: [declarative, specific]
HOOK (30 seconds spoken): [the opening story or observation that draws listeners in — specific moment, not a topic summary]
SEGMENT OUTLINE: [3–4 talking points with brief notes under each]
CLOSE: [1–2 sentences: what listeners should sit with after this episode]`,

  "Turn into blog post": `Write a full blog post for wvwacademy.com.

Structure:
TITLE: [declarative, specific — not clickbait]
META: [150 chars, SEO-friendly]

---

[Opening: hook — specific truth or named moment, 2–3 sentences]
[Body: 5–7 paragraphs — named problem → structural analysis → what shifts when you see it clearly]
[Close: grounded — does not end with "in conclusion"]
CTA: [1 sentence, soft invitation to consult or learn more]`,

  "Turn into short-form video": `Write a TikTok/Reel script for this theme.

Structure:
HOOK (first 3 seconds): [one statement that stops the scroll]
POINT 1: [15 seconds — specific truth]
POINT 2: [15 seconds — structural observation]
POINT 3: [15 seconds — what shifts]
CLOSE: [5 seconds — quiet, grounded, no hype]

ON-SCREEN TEXT SUGGESTIONS: [3–4 text overlays to reinforce key points]`,

  "Turn into LinkedIn thought piece": `Write a LinkedIn thought leadership post in Tiána Lynn's voice.

First-person, declarative. 200–300 words. Start with a structural truth or named moment — not a question. No "I'm excited to share." End grounded. Authority without performance.`,

  "Turn into training example": `Write a WVW Academy training example for this theme.

Structure:
CASE SCENARIO: [a realistic workplace scenario that illustrates this theme — specific roles, not generics]
WHAT'S ACTUALLY HAPPENING: [structural analysis — 2–3 paragraphs naming the system and pattern]
WHAT PRACTITIONERS SHOULD NOTICE: [3 specific signals to watch for]
INTERVENTION OPTIONS: [2–3 concrete approaches a consultant or HR leader can take]
DISCUSSION QUESTIONS: [3 questions for training participants]`,

  "Turn into client-facing case study": `Write a client-facing case study framing for this theme.

Structure:
SITUATION: [the organizational pattern — no specific names, but specific enough to be recognizable]
WHAT WVW OBSERVED: [what the data or signals showed — structural, not anecdotal]
THE INTERVENTION: [what WVW did or recommended — specific methodology]
THE SHIFT: [what changed organizationally — measurable or observable outcomes]
WHY THIS MATTERS: [1 paragraph connecting to WVW's broader consulting framework]`,
};

export async function POST(req: NextRequest) {
  const { postTitle, postPlatform, topic, recommendation } = await req.json() as {
    postTitle: string;
    postPlatform: string;
    topic: string;
    recommendation: string;
  };

  if (!postTitle || !recommendation) {
    return Response.json({ error: "postTitle and recommendation required" }, { status: 400 });
  }

  const formatPrompt = FORMAT_PROMPTS[recommendation] ?? `Repurpose this content as: ${recommendation}\n\nWrite the full output now.`;

  const prompt = `Original post to repurpose:
Title: "${postTitle}"
Platform: ${postPlatform}
Topic/Category: ${topic}

---

${formatPrompt}

Write the full output now. Start immediately — no preamble, no "here is your..." commentary.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 2000,
          system: SYSTEM,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of anthropicStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Generation failed";
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
