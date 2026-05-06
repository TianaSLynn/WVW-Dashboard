import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return Response.json({ error: "LINKEDIN_CLIENT_ID not configured" }, { status: 500 });
  }

  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/linkedin/callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile w_member_social",
    state: crypto.randomUUID(),
  });

  return Response.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  );
}
