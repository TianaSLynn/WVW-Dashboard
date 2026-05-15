#!/usr/bin/env node
/**
 * WVW Meta Token Setup Helper — Facebook + Threads
 * Usage: node scripts/get-meta-tokens.mjs
 */

import * as readline from 'readline';
import { exec } from 'child_process';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function get(url) {
  const res = await fetch(url);
  return res.json();
}
async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
}
function open(url) { exec(`open "${url}"`); }

// ══════════════════════════════════════════════════════════
//  FACEBOOK
// ══════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  PART 1 — Facebook Page Token');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('Open your Meta app → Settings → Basic:');
console.log('  https://developers.facebook.com/apps\n');

const appId     = (await ask('App ID:     ')).trim();
const appSecret = (await ask('App Secret: ')).trim();

// Short-lived user token via browser dialog
const fbScope = 'pages_manage_posts,pages_read_engagement,pages_show_list';
const fbAuthUrl = `https://www.facebook.com/dialog/oauth?client_id=${appId}&redirect_uri=https://www.facebook.com/connect/login_success.html&scope=${fbScope}&response_type=token`;

console.log('\nOpening Facebook auth in browser...');
console.log('(If it does not open, paste this URL manually:)');
console.log(`  ${fbAuthUrl}\n`);
open(fbAuthUrl);

console.log('After clicking Continue/Allow, look at the address bar.');
console.log('The URL will look like:');
console.log('  https://www.facebook.com/connect/login_success.html#access_token=EAA...&expires_in=...\n');
console.log('Copy everything between "access_token=" and the next "&"\n');

const fbShortToken = (await ask('Paste access_token: ')).trim();

console.log('\nFetching long-lived user token...');
const ltData = await get(
  `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${fbShortToken}`
);
if (ltData.error) {
  console.error('Failed:', ltData.error.message);
  rl.close(); process.exit(1);
}
const fbLongToken = ltData.access_token;
console.log('✓ Long-lived user token obtained');

console.log('Fetching Facebook pages...');
const pagesData = await get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${fbLongToken}`);
if (!pagesData.data?.length) {
  console.error('No pages found. Make sure you logged in as the account managing your WVW page.');
  rl.close(); process.exit(1);
}

let page;
if (pagesData.data.length === 1) {
  page = pagesData.data[0];
  console.log(`✓ Page: ${page.name}`);
} else {
  console.log('\nMultiple pages found:');
  pagesData.data.forEach((p, i) => console.log(`  ${i + 1}. ${p.name}`));
  const n = parseInt(await ask('Which number is WVW? '), 10) - 1;
  page = pagesData.data[n];
}

const fbPageToken = page.access_token;
const fbPageId    = page.id;

// ══════════════════════════════════════════════════════════
//  THREADS  (separate OAuth — threads.net, not facebook.com)
// ══════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  PART 2 — Threads Token');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('Threads requires its OWN separate token (it is NOT the same as Facebook).\n');
console.log('First, add a redirect URI to your Meta app for Threads:');
console.log('  → Your app → Use cases → Threads API → Settings');
console.log('  → Redirect callback URL: https://www.facebook.com/connect/login_success.html');
console.log('  → Save\n');

await ask('Press Enter when the Threads redirect URI is saved...');

const threadsScope   = 'threads_basic,threads_content_publish';
const threadsAuthUrl = `https://threads.net/oauth/authorize?client_id=${appId}&redirect_uri=https://www.facebook.com/connect/login_success.html&scope=${threadsScope}&response_type=code`;

console.log('\nOpening Threads auth in browser...');
console.log('(If it does not open, paste this URL manually:)');
console.log(`  ${threadsAuthUrl}\n`);
open(threadsAuthUrl);

console.log('After authorizing, your browser will redirect to a URL like:');
console.log('  https://www.facebook.com/connect/login_success.html?code=AQXXX...#_=_\n');
console.log('Copy the code value — everything between "code=" and "#" (or end of URL)\n');

const threadsCode = (await ask('Paste the code: ')).trim();

console.log('\nExchanging code for Threads token...');
const threadsTokenData = await post('https://graph.threads.net/oauth/access_token', {
  client_id: appId,
  client_secret: appSecret,
  code: threadsCode,
  grant_type: 'authorization_code',
  redirect_uri: 'https://www.facebook.com/connect/login_success.html',
});

if (threadsTokenData.error) {
  console.error('Token exchange failed:', threadsTokenData.error.message ?? JSON.stringify(threadsTokenData));
  console.log('The code expires quickly — run the script again if it took too long.');
  rl.close(); process.exit(1);
}

const threadsShortToken = threadsTokenData.access_token;
const threadsUserId     = String(threadsTokenData.user_id);
console.log(`✓ Short-lived Threads token (user_id: ${threadsUserId})`);

console.log('Exchanging for long-lived Threads token (60 days)...');
const threadsLtData = await get(
  `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_id=${appId}&client_secret=${appSecret}&access_token=${threadsShortToken}`
);

if (threadsLtData.error) {
  console.error('Long-lived exchange failed:', threadsLtData.error.message ?? JSON.stringify(threadsLtData));
  console.log('Using short-lived token instead — it will expire in 1 hour.');
}
const threadsLongToken = threadsLtData.access_token ?? threadsShortToken;
console.log('✓ Long-lived Threads token obtained');

// ══════════════════════════════════════════════════════════
//  OUTPUT
// ══════════════════════════════════════════════════════════
rl.close();

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Add ALL of these to Vercel → Environment Variables');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`FACEBOOK_APP_ID=${appId}`);
console.log(`FACEBOOK_APP_SECRET=${appSecret}`);
console.log(`FACEBOOK_PAGE_ID=${fbPageId}`);
console.log(`FACEBOOK_PAGE_ACCESS_TOKEN=${fbPageToken}`);
console.log(`THREADS_USER_ID=${threadsUserId}`);
console.log(`THREADS_ACCESS_TOKEN=${threadsLongToken}`);
console.log('\n✓ Done. Paste those into Vercel, then redeploy.\n');
