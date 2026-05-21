import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[threads-delete] data deletion request:", JSON.stringify(body));
  } catch {
    // body may not be JSON — that's fine
  }
  // Meta requires a JSON response with a confirmation code and status URL
  const confirmationCode = `wvw-del-${Date.now()}`;
  return Response.json({
    url: `https://wvw-dashboard.vercel.app/api/webhooks/threads-delete?code=${confirmationCode}`,
    confirmation_code: confirmationCode,
  });
}

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code");
  if (code) {
    return Response.json({ status: "complete", confirmation_code: code });
  }
  return new Response("Threads data deletion webhook active", { status: 200 });
}
