import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const result: Record<string, unknown> = {
    key_set: !!apiKey,
    key_prefix: apiKey ? apiKey.slice(0, 12) : "(not set)",
  };

  if (!apiKey) {
    return Response.json({ ...result, error: "ANTHROPIC_API_KEY not set" });
  }

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 120,
      messages: [{
        role: "user",
        content: 'Return ONLY valid JSON: {"status":"ok","model":"haiku","test":"passed"}',
      }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    let parsed: unknown = null;
    let parseError: string | null = null;
    if (match) {
      try { parsed = JSON.parse(match[0]); } catch (e) { parseError = String(e); }
    }

    result.haiku_raw = raw;
    result.haiku_match = !!match;
    result.haiku_parsed = parsed;
    result.haiku_parse_error = parseError;
    result.haiku_stop_reason = msg.stop_reason;
  } catch (err) {
    result.haiku_error = String(err);
  }

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 80,
      messages: [{
        role: "user",
        content: 'Return ONLY valid JSON: {"status":"ok","model":"sonnet","test":"passed"}',
      }],
    });
    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    result.sonnet_raw = raw;
    result.sonnet_stop_reason = msg.stop_reason;
  } catch (err) {
    result.sonnet_error = String(err);
  }

  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
