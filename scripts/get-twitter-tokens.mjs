#!/usr/bin/env node
/**
 * WVW Twitter Token Setup Helper
 *
 * Twitter tokens are generated directly in the developer portal — no OAuth flow needed.
 * This script walks you through it and validates the credentials work.
 *
 * Usage: node scripts/get-twitter-tokens.mjs
 */

import * as readline from 'readline';
import crypto from 'crypto';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

function pct(s) {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  WVW Twitter / X Token Setup');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('Step 1 — Open the Twitter Developer Portal:');
console.log('  https://developer.twitter.com/en/portal/projects-and-apps\n');
console.log('  If you do not have a project yet:');
console.log('  → Click "Create Project", give it any name, pick "Making a bot"');
console.log('  → Create an App inside the project\n');

await ask('Press Enter when you have an app open...');

console.log('\nStep 2 — Set app permissions to Read and Write:');
console.log('  In your app → Settings → User authentication settings');
console.log('  → App permissions: Read and Write');
console.log('  → Type of App: Web App, Automated App or Bot');
console.log('  → Callback URI: https://localhost (anything works)');
console.log('  → Save\n');

await ask('Press Enter when permissions are set to Read and Write...');

console.log('\nStep 3 — Get your keys:');
console.log('  In your app → Keys and tokens\n');
console.log('  You need four values:');
console.log('  1. API Key (also called Consumer Key) — under "Consumer Keys"');
console.log('  2. API Key Secret (also called Consumer Secret) — under "Consumer Keys"');
console.log('  3. Access Token — under "Authentication Tokens" → click Generate if not there');
console.log('  4. Access Token Secret — same section\n');
console.log('  IMPORTANT: The Access Token must say "Read and Write" next to it.');
console.log('  If it says "Read Only", click Regenerate after setting permissions in Step 2.\n');

const apiKey = (await ask('Paste API Key: ')).trim();
const apiSecret = (await ask('Paste API Key Secret: ')).trim();
const accessToken = (await ask('Paste Access Token: ')).trim();
const accessSecret = (await ask('Paste Access Token Secret: ')).trim();

console.log('\nValidating credentials by calling /2/users/me ...');

try {
  const url = 'https://api.twitter.com/2/users/me';
  const oauth = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  };
  const paramStr = Object.entries(oauth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${pct(k)}=${pct(v)}`)
    .join('&');
  const sigBase = `GET&${pct(url)}&${pct(paramStr)}`;
  const sigKey = `${pct(apiSecret)}&${pct(accessSecret)}`;
  const signature = crypto.createHmac('sha1', sigKey).update(sigBase).digest('base64');
  const authHeader = 'OAuth ' + Object.entries({ ...oauth, oauth_signature: signature })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${pct(k)}="${pct(v)}"`)
    .join(', ');

  const res = await fetch(url, { headers: { Authorization: authHeader } });
  const data = await res.json();

  if (data.data?.username) {
    console.log(`✓ Authenticated as @${data.data.username}\n`);
  } else {
    console.log('⚠ Could not verify credentials:', JSON.stringify(data));
    console.log('  Double-check the values and make sure Access Token has Read+Write.\n');
  }
} catch (err) {
  console.log('⚠ Validation failed:', err.message);
  console.log('  The values may still be correct — check and paste them into Vercel.\n');
}

rl.close();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Add these to Vercel → Project Settings → Environment Variables');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log(`TWITTER_API_KEY=${apiKey}`);
console.log(`TWITTER_API_SECRET=${apiSecret}`);
console.log(`TWITTER_ACCESS_TOKEN=${accessToken}`);
console.log(`TWITTER_ACCESS_SECRET=${accessSecret}`);
console.log('\n✓ Done. Paste those into Vercel, then redeploy.\n');
