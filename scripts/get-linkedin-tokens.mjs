#!/usr/bin/env node
/**
 * WVW LinkedIn Token Setup Helper
 * Usage: node scripts/get-linkedin-tokens.mjs
 */

import * as readline from 'readline';
import { exec } from 'child_process';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

const REDIRECT_URI = 'http://localhost:9871/callback';
const SCOPE = 'openid profile w_member_social w_organization_social';

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  WVW LinkedIn Token Setup');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ── Step 1: LinkedIn App ──────────────────────────────────────────────────────
console.log('Step 1 — Open your LinkedIn Developer app:');
console.log('  https://www.linkedin.com/developers/apps\n');
console.log('  If you have no app yet: Create app → give it any name → attach your WVW Company Page\n');
console.log('  In your app:');
console.log('  → Products tab → Request access to "Share on LinkedIn"');
console.log('  → Auth tab → Add this redirect URL exactly:');
console.log(`      ${REDIRECT_URI}`);
console.log('  → Save\n');

await ask('Press Enter when the redirect URL is saved in your LinkedIn app...');

console.log('\n  Now stay on the Auth tab and grab your credentials:\n');
const clientId     = (await ask('  Paste Client ID:     ')).trim();
const clientSecret = (await ask('  Paste Client Secret: ')).trim();

// ── Step 2: Auth URL ──────────────────────────────────────────────────────────
const authUrl = 'https://www.linkedin.com/oauth/v2/authorization?' + new URLSearchParams({
  response_type: 'code',
  client_id: clientId,
  redirect_uri: REDIRECT_URI,
  scope: SCOPE,
  state: 'wvw',
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Step 2 — Authorize LinkedIn\n');
console.log('  Opening this URL in your browser:');
console.log(`  ${authUrl}\n`);
exec(`open "${authUrl}"`);

console.log('  → Click "Allow" on the LinkedIn page');
console.log('  → Your browser will then show an error like "localhost refused to connect"');
console.log('  → That is expected. Look at the address bar — the URL will look like:');
console.log('      http://localhost:9871/callback?code=AQXXXX...&state=wvw\n');
console.log('  → Copy ONLY the "code" value (everything between "code=" and "&state")');
console.log('  → It starts with "AQ" and is about 200 characters long\n');

const code = (await ask('  Paste the code here: ')).trim();

// ── Step 3: Exchange code ─────────────────────────────────────────────────────
console.log('\nExchanging code for access token...');
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
  console.log('\nCommon causes:');
  console.log('  - The code expires after ~10 minutes. Run the script again if it took too long.');
  console.log('  - The redirect URI must match exactly, including http:// and no trailing slash.');
  rl.close();
  process.exit(1);
}

const accessToken = tokenRes.data.access_token;
const expiresIn   = tokenRes.data.expires_in ?? 5184000;
const expiresDate = new Date(Date.now() + expiresIn * 1000).toLocaleDateString();
console.log(`✓ Got access token (expires ${expiresDate})`);

// ── Step 4: Fetch person URN ──────────────────────────────────────────────────
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

// ── Step 5: Org URN ───────────────────────────────────────────────────────────
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
