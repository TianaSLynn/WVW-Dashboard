#!/usr/bin/env node
/**
 * WVW LinkedIn Token Setup Helper
 * Usage: node scripts/get-linkedin-tokens.mjs
 */

import * as readline from 'readline';
import * as http from 'http';
import { exec } from 'child_process';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

const PORT = 9871;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPE = 'openid profile w_member_social';

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

// Starts a one-shot local server, returns the auth code from LinkedIn's redirect
function waitForCallback() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<h2 style="font-family:sans-serif;color:#c00">LinkedIn returned an error: ${error}</h2><p>${url.searchParams.get('error_description') ?? ''}</p>`);
        server.close();
        reject(new Error(`LinkedIn OAuth error: ${error} — ${url.searchParams.get('error_description') ?? ''}`));
        return;
      }

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<h2 style="font-family:sans-serif;color:#1C3A2A">✓ Authorization successful!</h2><p>You can close this tab and return to the terminal.</p>`);
        server.close();
        resolve(code);
        return;
      }

      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('No code or error in callback');
    });

    server.listen(PORT, () => {
      console.log(`  ✓ Listening on http://localhost:${PORT}/callback\n`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${PORT} is already in use. Close whatever is running on it and try again.`));
      } else {
        reject(err);
      }
    });

    // Timeout after 3 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Timed out waiting for LinkedIn callback (3 minutes). Run the script again.'));
    }, 3 * 60 * 1000);
  });
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  WVW LinkedIn Token Setup');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('  In your LinkedIn app (linkedin.com/developers/apps):');
console.log('  → Auth tab → Authorized redirect URLs must include:');
console.log(`      ${REDIRECT_URI}`);
console.log('  → Products tab → "Share on LinkedIn" must be listed under Added products\n');

await ask('Press Enter when those are confirmed...');

console.log('\n  Grab your credentials from the Auth tab:\n');
const clientId     = (await ask('  Paste Client ID:     ')).trim();
const clientSecret = (await ask('  Paste Client Secret: ')).trim();

// ── Start local server before opening the browser ────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Starting local callback server...');

const callbackPromise = waitForCallback();

const authUrl = 'https://www.linkedin.com/oauth/v2/authorization?' + new URLSearchParams({
  response_type: 'code',
  client_id: clientId,
  redirect_uri: REDIRECT_URI,
  scope: SCOPE,
  state: 'wvw',
});

console.log('Opening LinkedIn authorization in your browser...');
console.log('If it does not open automatically, copy this URL:\n');
console.log(authUrl + '\n');
exec(`open '${authUrl}'`);

console.log('Waiting for you to click Allow on LinkedIn...');

let code;
try {
  code = await callbackPromise;
  console.log('✓ Got authorization code');
} catch (err) {
  console.error('\n' + err.message);
  rl.close();
  process.exit(1);
}

// ── Exchange code for token ───────────────────────────────────────────────────
console.log('Exchanging code for access token...');
const tokenRes = await fetchJson('https://www.linkedin.com/oauth/v2/accessToken', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: clientId,
    client_secret: clientSecret,
  }).toString(),
});

if (!tokenRes.ok) {
  console.error('\nToken exchange failed:', JSON.stringify(tokenRes.data, null, 2));
  rl.close();
  process.exit(1);
}

const accessToken = tokenRes.data.access_token;
const expiresIn   = tokenRes.data.expires_in ?? 5184000;
const expiresDate = new Date(Date.now() + expiresIn * 1000).toLocaleDateString();
console.log(`✓ Got access token (expires ${expiresDate})`);

// ── Fetch person URN ──────────────────────────────────────────────────────────
console.log('Fetching your LinkedIn profile...');
const profileRes = await fetchJson('https://api.linkedin.com/v2/userinfo', {
  headers: { Authorization: `Bearer ${accessToken}` },
});

let personUrn  = '';
let personName = '';
if (profileRes.ok && profileRes.data.sub) {
  personUrn  = `urn:li:person:${profileRes.data.sub}`;
  personName = profileRes.data.name ?? '';
  console.log(`✓ Logged in as: ${personName || personUrn}`);
} else {
  console.log('⚠ Could not auto-fetch profile URN:', JSON.stringify(profileRes.data));
  personUrn = (await ask('  Paste your LinkedIn Person URN (or leave blank): ')).trim();
}

// ── Fetch org URN ─────────────────────────────────────────────────────────────
console.log('Looking up your WVW company page org ID...');
const orgRes = await fetchJson(
  'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED',
  { headers: { Authorization: `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' } }
);

let orgUrn = '';
if (orgRes.ok && Array.isArray(orgRes.data.elements) && orgRes.data.elements.length > 0) {
  if (orgRes.data.elements.length === 1) {
    orgUrn = orgRes.data.elements[0].organization;
    console.log(`✓ Found org: ${orgUrn}`);
  } else {
    console.log('\nFound multiple organizations:');
    orgRes.data.elements.forEach((el, i) => console.log(`  ${i + 1}. ${el.organization}`));
    const choice = parseInt(await ask('Which number is WVW? '), 10) - 1;
    orgUrn = orgRes.data.elements[choice]?.organization ?? '';
  }
} else {
  console.log('⚠ Could not auto-fetch org. Enter your company page numeric ID.');
  console.log('  Find it in the URL: linkedin.com/company/12345678 → ID is 12345678');
  const rawId = (await ask('  Paste org numeric ID: ')).trim();
  orgUrn = `urn:li:organization:${rawId}`;
}

rl.close();

// ── Output ────────────────────────────────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Add these to Vercel → Project Settings → Environment Variables');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`LINKEDIN_CLIENT_ID=${clientId}`);
console.log(`LINKEDIN_CLIENT_SECRET=${clientSecret}`);
console.log(`LINKEDIN_ACCESS_TOKEN=${accessToken}`);
console.log(`LINKEDIN_PERSON_URN=${personUrn}`);
console.log(`LINKEDIN_ORG_ACCESS_TOKEN=${accessToken}`);
console.log(`LINKEDIN_ORG_URN=${orgUrn}`);
console.log(`\nNote: token expires ${expiresDate}. Run this script again when it does.`);
console.log('\n✓ Done. Paste those into Vercel, then redeploy.\n');
