const FB_VERSION = "v19.0";

export async function GET() {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const igId  = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!token || !igId) {
    return Response.json({ error: "Missing FACEBOOK_PAGE_ACCESS_TOKEN or INSTAGRAM_BUSINESS_ACCOUNT_ID" }, { status: 400 });
  }

  // Verify token and get IG account info
  const meRes = await fetch(
    `https://graph.facebook.com/${FB_VERSION}/${igId}?fields=id,username,name,biography&access_token=${token}`
  );
  const meData = await meRes.json() as Record<string, unknown>;

  // Check token validity
  const debugRes = await fetch(
    `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`
  );
  const debugData = await debugRes.json() as { data?: { expires_at?: number; scopes?: string[]; is_valid?: boolean } };

  const expiresAt = debugData.data?.expires_at;
  const expired = expiresAt ? expiresAt < Date.now() / 1000 : false;
  const expiresDate = expiresAt ? new Date(expiresAt * 1000).toISOString() : "unknown";

  return Response.json({
    account: meData,
    token: {
      valid: debugData.data?.is_valid ?? false,
      expires: expiresDate,
      expired,
      scopes: debugData.data?.scopes ?? [],
    },
    issues: [
      !meRes.ok ? `Account lookup failed: ${JSON.stringify(meData)}` : null,
      expired ? `Token expired at ${expiresDate}` : null,
      !(debugData.data?.scopes ?? []).includes("instagram_content_publish")
        ? "Missing scope: instagram_content_publish"
        : null,
    ].filter(Boolean),
  });
}
