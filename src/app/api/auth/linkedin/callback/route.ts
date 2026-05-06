import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return new Response(errorPage(error ?? "No code returned from LinkedIn"), {
      headers: { "Content-Type": "text/html" },
    });
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/linkedin/callback`;

  if (!clientId || !clientSecret) {
    return new Response(errorPage("LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET not set in .env.local"), {
      headers: { "Content-Type": "text/html" },
    });
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return new Response(errorPage(`Token exchange failed: ${err}`), {
      headers: { "Content-Type": "text/html" },
    });
  }

  const { access_token, expires_in } = await tokenRes.json() as {
    access_token: string;
    expires_in: number;
  };

  // Get person URN
  const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const profile = profileRes.ok ? await profileRes.json() as { sub?: string; name?: string } : {};
  const personUrn = profile.sub ? `urn:li:person:${profile.sub}` : "urn:li:person:PASTE_YOUR_ID";
  const name = profile.name ?? "your account";

  const expiresDate = new Date(Date.now() + expires_in * 1000).toLocaleDateString();

  return new Response(successPage(access_token, personUrn, name, expiresDate), {
    headers: { "Content-Type": "text/html" },
  });
}

function successPage(token: string, personUrn: string, name: string, expires: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>LinkedIn Connected — WVW</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "DM Sans", system-ui, sans-serif; background: #F9F5ED; color: #1A1714; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .card { background: #F5F0E8; border: 1px solid #DDD7CD; border-radius: 1.5rem; padding: 2.5rem; max-width: 640px; width: 100%; }
    h1 { font-family: Georgia, serif; font-size: 1.75rem; margin-bottom: 0.5rem; }
    .sub { color: #3D3935; font-size: 0.875rem; margin-bottom: 2rem; }
    label { display: block; font-size: 0.75rem; font-weight: 600; color: #3D3935; margin-bottom: 0.4rem; margin-top: 1.25rem; }
    .token-box { background: #1A1714; color: #F5F0E8; border-radius: 0.75rem; padding: 1rem 1.25rem; font-family: monospace; font-size: 0.75rem; word-break: break-all; position: relative; }
    .copy-btn { margin-top: 0.5rem; background: #1C3A2A; color: #F5F0E8; border: none; border-radius: 0.5rem; padding: 0.4rem 0.9rem; font-size: 0.75rem; cursor: pointer; }
    .copy-btn:hover { background: #4A5E4F; }
    .instructions { margin-top: 2rem; background: #EDE8DF; border-radius: 1rem; padding: 1.25rem; font-size: 0.8rem; color: #3D3935; line-height: 1.7; }
    .instructions strong { color: #1A1714; }
    .close-btn { margin-top: 1.5rem; display: inline-block; background: #1C3A2A; color: #F5F0E8; border-radius: 0.75rem; padding: 0.6rem 1.5rem; font-size: 0.875rem; text-decoration: none; cursor: pointer; border: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>LinkedIn Connected</h1>
    <p class="sub">Authorized as <strong>${name}</strong> &mdash; token expires ${expires}</p>

    <label>LINKEDIN_ACCESS_TOKEN (paste into .env.local)</label>
    <div class="token-box" id="token">${token}</div>
    <button class="copy-btn" onclick="copy('token', this)">Copy Token</button>

    <label>LINKEDIN_PERSON_URN (paste into .env.local)</label>
    <div class="token-box" id="urn">${personUrn}</div>
    <button class="copy-btn" onclick="copy('urn', this)">Copy URN</button>

    <div class="instructions">
      <strong>Next steps:</strong><br/>
      1. Copy both values above into <code>.env.local</code><br/>
      2. Restart the dev server (<code>npm run dev</code>)<br/>
      3. For WVW Company Page posts, also set <code>LINKEDIN_ORG_URN=urn:li:organization:YOUR_ORG_ID</code><br/>
      &nbsp;&nbsp;&nbsp;(find your org ID in the URL of your LinkedIn company page)<br/>
      4. Click &ldquo;Post Today&rsquo;s Content Now&rdquo; in the Auto-Post tab to test
    </div>

    <button class="close-btn" onclick="window.close()">Close this window</button>
  </div>
  <script>
    function copy(id, btn) {
      const text = document.getElementById(id).textContent;
      navigator.clipboard.writeText(text).then(() => { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy ' + (id === 'token' ? 'Token' : 'URN'), 2000); });
    }
  </script>
</body>
</html>`;
}

function errorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>LinkedIn Auth Error — WVW</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #F9F5ED; color: #1A1714; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .card { background: #F5F0E8; border: 1px solid #DDD7CD; border-radius: 1.5rem; padding: 2.5rem; max-width: 480px; width: 100%; }
    h1 { font-family: Georgia, serif; font-size: 1.5rem; margin-bottom: 1rem; }
    p { color: #3D3935; font-size: 0.875rem; }
    code { background: #EDE8DF; padding: 0.15rem 0.4rem; border-radius: 0.3rem; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Authorization Error</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
