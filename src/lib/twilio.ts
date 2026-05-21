import twilio from "twilio";

const client = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Twilio credentials not configured");
  return twilio(sid, token);
};

export async function sendSMS(to: string, body: string): Promise<string> {
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) throw new Error("TWILIO_FROM_NUMBER not configured");
  if (!to) throw new Error("USER_PHONE_NUMBER not configured");
  const msg = await client().messages.create({ from, to, body });
  console.log(`[twilio] sent SID=${msg.sid} status=${msg.status} to=${to.slice(0,6)}***`);
  return msg.sid;
}

export async function sendMorningText(body: string): Promise<string> {
  const to = process.env.USER_PHONE_NUMBER;
  if (!to) throw new Error("USER_PHONE_NUMBER not set");
  return sendSMS(to, body);
}
