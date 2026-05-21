import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const shortToken = searchParams.get("token");

  // No token — show instructions page
  if (!shortToken) {
    return new Response(instructionsPage(origin), {
      headers: { "Content-Type": "text/html" },
    });
  }

  try {
    const appSecret = process.env.THREADS_APP_SECRET;

    let finalToken = shortToken;
    let expiresNote = "token from Graph API Explorer — add to Vercel quickly";

    // Try to exchange for long-lived if app secret available
    if (appSecret) {
      try {
        const longRes = await fetch(
          `https://graph.threads.net/access_token?${new URLSearchParams({
            grant_type: "th_exchange_token",
            client_secret: appSecret,
            access_token: shortToken,
          })}`
        );
        if (longRes.ok) {
          const longData = await longRes.json() as { access_token?: string; expires_in?: number };
          if (longData.access_token) {
            finalToken = longData.access_token;
            const days = longData.expires_in ? Math.round(longData.expires_in / 86400) : 60;
            expiresNote = `long-lived — expires in ~${days} days`;
          }
        }
      } catch {
        // exchange failed — use original token
      }
    }

    // Get user ID
    let userId = "";
    let username = "your account";
    try {
      const profileRes = await fetch(
        `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${finalToken}`
      );
      if (profileRes.ok) {
        const p = await profileRes.json() as { id?: string; username?: string };
        userId = p.id ?? "";
        username = p.username ?? "your account";
      }
    } catch {
      // profile fetch failed — show token anyway
    }

    return new Response(successPage(finalToken, userId, username, expiresNote), {
      headers: { "Content-Type": "text/html" },
    });
  } catch (err) {
    return new Response(errorPage(`Unexpected error: ${String(err)}`), {
      headers: { "Content-Type": "text/html" },
    });
  }
}

function instructionsPage(origin: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Connect Threads — WVW</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "DM Sans", system-ui, sans-serif; background: #F9F5ED; color: #1A1714; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .card { background: #F5F0E8; border: 1px solid #DDD7CD; border-radius: 1.5rem; padding: 2.5rem; max-width: 640px; width: 100%; }
    h1 { font-family: Georgia, serif; font-size: 1.75rem; margin-bottom: 0.5rem; }
    .sub { color: #3D3935; font-size: 0.875rem; margin-bottom: 2rem; }
    .step { background: #EDE8DF; border-radius: 1rem; padding: 1.25rem; margin-bottom: 1rem; font-size: 0.85rem; line-height: 1.7; color: #3D3935; }
    .step strong { color: #1A1714; display: block; margin-bottom: 0.25rem; }
    .step code { background: #1A1714; color: #F5F0E8; padding: 0.15rem 0.45rem; border-radius: 0.3rem; font-size: 0.8rem; }
    .step a { color: #1C3A2A; font-weight: 600; }
    .form-row { display: flex; gap: 0.5rem; margin-top: 1.5rem; }
    .form-row input { flex: 1; padding: 0.65rem 1rem; border: 1px solid #DDD7CD; border-radius: 0.75rem; background: #F9F5ED; font-size: 0.85rem; color: #1A1714; }
    .form-row button { background: #1C3A2A; color: #F5F0E8; border: none; border-radius: 0.75rem; padding: 0.65rem 1.25rem; font-size: 0.85rem; cursor: pointer; white-space: nowrap; }
    .form-row button:hover { background: #4A5E4F; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Connect Threads</h1>
    <p class="sub">Meta's redirect flow is being difficult — use this manual method instead. Takes 2 minutes.</p>

    <div class="step">
      <strong>Step 1 — Open Meta's Graph API Explorer</strong>
      Go to <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener">developers.facebook.com/tools/explorer</a>
    </div>

    <div class="step">
      <strong>Step 2 — Select your app</strong>
      In the top-right dropdown, choose your Threads app (the one with App ID <code>${process.env.THREADS_APP_ID ?? "your app"}</code>)
    </div>

    <div class="step">
      <strong>Step 3 — Add permissions</strong>
      Click <strong>Add a Permission</strong> and add both:<br/>
      <code>threads_basic</code> &nbsp; <code>threads_content_publish</code>
    </div>

    <div class="step">
      <strong>Step 4 — Generate the token</strong>
      Click <strong>Generate Access Token</strong> → authorize when prompted → copy the token that appears
    </div>

    <div class="step">
      <strong>Step 5 — Paste it here and click Exchange</strong>
      We'll convert it to a 60-day token automatically.
    </div>

    <div class="form-row">
      <input id="tok" type="text" placeholder="Paste your access token here..." />
      <button onclick="go()">Exchange →</button>
    </div>
  </div>
  <script>
    function go() {
      const t = document.getElementById('tok').value.trim();
      if (!t) return;
      window.location.href = '${origin}/api/auth/threads/manual?token=' + encodeURIComponent(t);
    }
    document.getElementById('tok').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') go();
    });
  </script>
</body>
</html>`;
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
    code { background: #DDD7CD; padding: 0.1rem 0.35rem; border-radius: 0.25rem; font-size: 0.78rem; }
    .close-btn { margin-top: 1.5rem; display: inline-block; background: #1C3A2A; color: #F5F0E8; border-radius: 0.75rem; padding: 0.6rem 1.5rem; font-size: 0.875rem; cursor: pointer; border: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Threads Connected ✓</h1>
    <p class="sub">Authorized as <strong>@${username}</strong> — ${expiresNote}</p>

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
      4. Redeploy — Threads posting will be active immediately
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

function errorPage(msg: string): string {
  return `<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem;background:#F9F5ED;color:#1A1714;">
    <h2 style="font-family:Georgia,serif;margin-bottom:1rem;">Error</h2>
    <p style="color:#3D3935;">${msg}</p>
  </body></html>`;
}
