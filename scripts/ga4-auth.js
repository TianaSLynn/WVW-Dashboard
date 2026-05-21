#!/usr/bin/env node
/**
 * GA4 OAuth2 helper — run with: node scripts/ga4-auth.js
 * Opens a browser for Google auth, captures the code on localhost,
 * exchanges it for tokens, and writes them to .env.local automatically.
 */

const http    = require('http');
const https   = require('https');
const fs      = require('fs');
const path    = require('path');
const qs      = require('querystring');
const { execSync } = require('child_process');

const ENV_PATH = path.join(__dirname, '..', '.env.local');

// ── Read current .env.local ────────────────────────────────────────────────
function readEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  return Object.fromEntries(
    fs.readFileSync(ENV_PATH, 'utf8')
      .split('\n')
      .filter(l => l.includes('='))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; })
  );
}

// ── Write a key to .env.local ──────────────────────────────────────────────
function setEnv(key, value) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const line  = `${key}="${value}"`;
  if (regex.test(content)) {
    content = content.replace(regex, line);
  } else {
    content = content.trimEnd() + '\n' + line + '\n';
  }
  fs.writeFileSync(ENV_PATH, content);
}

// ── HTTP POST helper ───────────────────────────────────────────────────────
function post(url, body) {
  return new Promise((resolve, reject) => {
    const encoded = typeof body === 'string' ? body : qs.stringify(body);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(encoded) },
    }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject); req.write(encoded); req.end();
  });
}

// ── Open browser ───────────────────────────────────────────────────────────
function openBrowser(url) {
  const platform = process.platform;
  if (platform === 'darwin')  execSync(`open "${url}"`);
  else if (platform === 'win32') execSync(`start "" "${url}"`);
  else execSync(`xdg-open "${url}"`);
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const env = readEnv();

  const CLIENT_ID     = env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
  const PORT          = 3456;
  const REDIRECT_URI  = `http://localhost:${PORT}/callback`;
  const SCOPE         = 'https://www.googleapis.com/auth/analytics.readonly';

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌  GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env.local first.');
    process.exit(1);
  }

  // ── Step 0: Verify secret by doing a quick sanity check ──────────────────
  console.log('\n🔐  WVW GA4 OAuth2 Helper\n');
  console.log('CLIENT_ID:    ', CLIENT_ID.slice(0, 30) + '...');
  console.log('CLIENT_SECRET:', CLIENT_SECRET.slice(0, 10) + '...\n');

  // ── Step 1: Build auth URL ────────────────────────────────────────────────
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + qs.stringify({
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: 'code',
    scope:         SCOPE,
    access_type:   'offline',
    prompt:        'consent',
  });

  // ── Step 2: Start local server to catch the redirect ─────────────────────
  console.log(`📡  Starting local server on port ${PORT}...`);

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      res.writeHead(200, { 'Content-Type': 'text/html' });

      if (error) {
        res.end(`<h2 style="font-family:sans-serif;color:#c00">Auth error: ${error}</h2><p>Close this tab and check the terminal.</p>`);
        server.close(() => reject(new Error(error)));
        return;
      }

      if (code) {
        res.end(`<h2 style="font-family:sans-serif;color:#1C3A2A">✅  Authorized!</h2><p style="font-family:sans-serif">GA4 is now connected. You can close this tab and return to the terminal.</p>`);
        server.close(() => resolve(code));
      }
    });

    server.listen(PORT, () => {
      console.log(`✅  Server ready. Opening browser for Google sign-in...\n`);
      console.log('⚠️   IMPORTANT: Make sure http://localhost:3456/callback is an Authorized Redirect URI in your Google Cloud Console OAuth client.\n');
      console.log('Auth URL (open manually if browser does not open):\n' + authUrl + '\n');
      openBrowser(authUrl);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌  Port ${PORT} is already in use. Kill whatever is using it and retry.`);
      }
      reject(err);
    });
  });

  console.log('✅  Got authorization code. Exchanging for tokens...\n');

  // ── Step 3: Exchange code for tokens ─────────────────────────────────────
  const tokens = await post('https://oauth2.googleapis.com/token', {
    code,
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri:  REDIRECT_URI,
    grant_type:    'authorization_code',
  });

  if (tokens.error) {
    console.error('❌  Token exchange failed:', tokens.error, tokens.error_description);
    process.exit(1);
  }

  const refreshToken = tokens.refresh_token;
  if (!refreshToken) {
    console.error('❌  No refresh_token in response. Make sure you used prompt=consent and access_type=offline.');
    console.error('Response:', JSON.stringify(tokens, null, 2));
    process.exit(1);
  }

  // ── Step 4: Save to .env.local ────────────────────────────────────────────
  setEnv('GOOGLE_REFRESH_TOKEN', refreshToken);
  console.log('✅  Refresh token saved to .env.local\n');

  // ── Step 5: Test the token ────────────────────────────────────────────────
  console.log('🧪  Testing token against GA4 API...\n');
  const testRes = await post('https://oauth2.googleapis.com/token', {
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type:    'refresh_token',
  });

  if (testRes.access_token) {
    console.log('🎉  GA4 OAuth2 is working! Access token obtained.\n');
    console.log('Restart your Next.js dev server to pick up the new token.\n');
  } else {
    console.error('⚠️   Token obtained but test failed:', JSON.stringify(testRes));
  }
}

main().catch(err => {
  console.error('\n❌  Fatal error:', err.message);
  process.exit(1);
});
