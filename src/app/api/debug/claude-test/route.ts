import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const result: Record<string, unknown> = {
    key_set: !!apiKey,
    key_prefix: apiKey ? apiKey.slice(0, 12) : "(not set)",
  };

  if (!apiKey) {
    return Response.json({ ...result, error: "ANTHROPIC_API_KEY not set" });
  }

  const client = new Anthropic({ apiKey });

  // Test 1: Haiku extras prompt (mirrors the real generateExtras call)
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 250,
      messages: [{
        role: "user",
        content: `Today is Wednesday. Morning briefing for Tiána Lynn — Black neurodivergent founder of WVW.\n\nReturn ONLY valid JSON:\n{\n  "wisdom": "One short WVW wisdom. Structural, never hollow. Max 80 chars.",\n  "black_fact": "One sentence. Real Black person's achievement — name them. Max 90 chars.",\n  "song": "Artist - Song Title. Black artist. Max 40 chars."\n}`,
      }],
    });
    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    let parsed: unknown = null;
    let parseError: string | null = null;
    if (match) {
      try { parsed = JSON.parse(match[0]); } catch (e) { parseError = String(e); }
    }
    result.extras_raw = raw;
    result.extras_match = !!match;
    result.extras_parsed = parsed;
    result.extras_parse_error = parseError;
    result.extras_stop_reason = msg.stop_reason;
  } catch (err) {
    result.extras_error = String(err);
  }

  // Test 2: Sonnet Part 1 (mirrors generateBriefPart1 — no social posts)
  try {
    const t0 = Date.now();
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `Today is Wednesday. Return ONLY valid JSON with these fields: {"vibe_line":"1 sentence","word_of_day":"one word","astro_theme":"1 sentence","herb_primary":"herb name","workout_focus":"Abs / Core","be_name":"Full name of a real Black person","prompt_healing":"1 sentence"}`,
      }],
    });
    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    result.part1_raw_length = raw.length;
    result.part1_match = !!match;
    result.part1_duration_ms = Date.now() - t0;
    result.part1_stop_reason = msg.stop_reason;
    if (match) {
      try { result.part1_parsed_keys = Object.keys(JSON.parse(match[0])); } catch { result.part1_parse_error = "failed"; }
    }
  } catch (err) {
    result.part1_error = String(err);
  }

  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
