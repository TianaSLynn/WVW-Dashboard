import { NextRequest } from "next/server";
import twilio from "twilio";

export async function GET(req: NextRequest) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = process.env.USER_PHONE_NUMBER;

  const info = {
    sid_set: !!sid,
    token_set: !!token,
    from: from ?? "(not set)",
    to_masked: to ? `${to.slice(0, 3)}***${to.slice(-4)}` : "(not set)",
    to_format_ok: to ? /^\+1\d{10}$/.test(to) : false,
  };

  const send = req.nextUrl.searchParams.get("send") === "1";
  if (!send) {
    return Response.json({ info, note: "Add ?send=1 to send a test SMS" });
  }

  if (!sid || !token || !from || !to) {
    return Response.json({ error: "Missing Twilio env vars", info }, { status: 400 });
  }

  try {
    const client = twilio(sid, token);
    const msg = await client.messages.create({
      from,
      to,
      body: "WVW test SMS — your morning briefing is configured correctly! 🦄",
    });
    return Response.json({ sent: true, sid: msg.sid, status: msg.status, info });
  } catch (err) {
    return Response.json({ sent: false, error: String(err), info }, { status: 500 });
  }
}
