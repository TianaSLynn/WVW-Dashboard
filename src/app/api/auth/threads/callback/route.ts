import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorReason = searchParams.get("error_reason");

  if (error || !code) {
    return new Response(errorPage(error ?? "No code returned", errorReason ?? ""), {
      headers: { "Content-Type": "text/html" },
    });
  }

  const appId = process.env.THREADS_APP_ID;
  const appSecret = process.env.THREADS_APP_SECRET;
  const redirectUri = `${origin}/api/auth/threads/callback`;

  if (!appId || !appSecret) {
    return new Response(errorPage("THREADS_APP_ID or THREADS_APP_SECRET not configured", ""), {
      headers: { "Content-Type": "text/html" },
    });
  }

  // Step 1: Exchange code for short-lived token
  const shortTokenRes = await fetch("https://graph.threads.net/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }).toString(),
  });

  if (!shortTokenRes.ok) {
    const err = await shortTokenRes.text();
    return new Response(errorPage(`Short-lived token exchange failed: ${err}`, ""), {
      headers: { "Content-Type": "text/html" },
    });
  }

  const shortData = await shortTokenRes.json() as { access_token?: string; user_id?: number; error_message?: string };
  if (!shortData.access_token) {
    return new Response(errorPage(`Token exchange error: ${shortData.error_message ?? JSON.stringify(shortData)}`, ""), {
      headers: { "Content-Type": "text/html" },
    });
  }

  // Step 2: Exchange for long-lived token (60 days)
  const longTokenRes = await fetch(
    `https://graph.threads.net/access_token?${new URLSearchParams({
      grant_type: "th_exchange_token",
      client_secret: appSecret,
      access_token: shortData.access_token,
    }).toString()}`
  );

  let finalToken = shortData.access_token;
  let expiresNote = "short-lived (~1 hour) — long-lived exchange failed";

  if (longTokenRes.ok) {
    const longData = await longTokenRes.json() as { access_token?: string; expires_in?: number };
    if (longData.access_token) {
      finalToken = longData.access_token;
      const days = longData.expires_in ? Math.round(longData.expires_in / 86400) : 60;
      const expDate = new Date(Date.now() + (longData.expires_in ?? 5184000) * 1000).toLocaleDateString();
      expiresNote = `long-lived — expires in ${days} days (${expDate})`;
    }
  }

  // Step 3: Get Threads user info
  const profileRes = await fetch(
    `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${finalToken}`
  );
  const profile = profileRes.ok
    ? await profileRes.json() as { id?: string; username?: string }
    : {};

  const userId = profile.id ?? String(shortData.user_id ?? "");
  const username = profile.username ?? "your account";

  return new Response(successPage(finalToken, userId, username, expiresNote), {
    headers: { "Content-Type": "text/html" },
  });
}

function successPage(token: string, userId: string, username: string, expiresNote: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Threads Connected — WVW</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "DM Sans", system-ui, sans-serif; background: #F9F5ED; color: #1A1714; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .card { background: #F5F0E8; border: 1px solid #DDD7CD; border-radius: 1.5rem; padding: 2.5rem; max-width: 640px; width: 100%; }
    h1 { font-family: Georgia, serif; font-size: 1.75rem; margin-bottom: 0.5rem; }
    .sub { color: #3D3935; font-size: 0.875rem; margin-bottom: 2rem; }
    label { display: block; font-size: 0.75rem; font-weight: 600; color: #3D3935; margin-bottom: 0.4rem; margin-top: 1.25rem; }
    .token-box { background: #1A1714; color: #F5F0E8; border-radius: 0.75rem; padding: 1rem 1.25rem; font-family: monospace; font-size: 0.75rem; word-break: break-all; }
    .copy-btn { margin-top: 0.5rem; background: #1C3A2A; color: #F5F0E8; border: none; border-radius: 0.5rem; padding: 0.4rem 0.9rem; font-size: 0.75rem; cursor: pointer; }
    .copy-btn:hover { background: #4A5E4F; }
    .instructions { margin-top: 2rem; background: #EDE8DF; border-radius: 1rem; padding: 1.25rem; font-size: 0.8rem; color: #3D3935; line-height: 1.7; }
    .instructions strong { color: #1A1714; }
    .close-btn { margin-top: 1.5rem; display: inline-block; background: #1C3A2A; color: #F5F0E8; border-radius: 0.75rem; padding: 0.6rem 1.5rem; font-size: 0.875rem; text-decoration: none; cursor: pointer; border: none; }
    .badge { display: inline-block; background: #4A5E4F; color: #F5F0E8; border-radius: 0.4rem; padding: 0.15rem 0.5rem; font-size: 0.7rem; margin-left: 0.5rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Threads Connected <span class="badge">✓</span></h1>
    <p class="sub">Authorized as <strong>@${username}</strong> &mdash; ${expiresNote}</p>

    <label>THREADS_ACCESS_TOKEN</label>
    <div class="token-box" id="token">${token}</div>
    <button class="copy-btn" onclick="copy('token', this)">Copy Token</button>

    <label>THREADS_USER_ID</label>
    <div class="token-box" id="uid">${userId}</div>
    <button class="copy-btn" onclick="copy('uid', this)">Copy User ID</button>

    <div class="instructions">
      <strong>Next steps:</strong><br/>
      1. Copy both values above<br/>
      2. Go to <strong>Vercel → Settings → Environment Variables</strong><br/>
      3. Set <code>THREADS_ACCESS_TOKEN</code> and <code>THREADS_USER_ID</code><br/>
      4. Redeploy or wait for the next deployment — no code changes needed<br/>
      5. Threads long-lived tokens expire in <strong>60 days</strong> — bookmark this URL to renew<br/>
      &nbsp;&nbsp;&nbsp;<strong>${typeof window !== 'undefined' ? '' : ''}</strong>
    </div>

    <button class="close-btn" onclick="window.close()">Close this window</button>
  </div>
  <script>
    function copy(id, btn) {
      const text = document.getElementById(id).textContent;
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = id === 'token' ? 'Copy Token' : 'Copy User ID', 2000);
      });
    }
  </script>
</body>
</html>`;
}

function errorPage(message: string, reason: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Threads Auth Error — WVW</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #F9F5ED; color: #1A1714; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .card { background: #F5F0E8; border: 1px solid #DDD7CD; border-radius: 1.5rem; padding: 2.5rem; max-width: 480px; width: 100%; }
    h1 { font-family: Georgia, serif; font-size: 1.5rem; margin-bottom: 1rem; color: #C4A09A; }
    p { color: #3D3935; font-size: 0.875rem; line-height: 1.6; }
    code { background: #EDE8DF; padding: 0.15rem 0.4rem; border-radius: 0.3rem; font-size: 0.8rem; }
    .reason { margin-top: 0.5rem; font-size: 0.8rem; color: #4A5E4F; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Authorization Error</h1>
    <p>${message}</p>
    ${reason ? `<p class="reason">Reason: ${reason}</p>` : ""}
  </div>
</body>
</html>`;
}
