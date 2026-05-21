#!/usr/bin/env node
/**
 * Sets Vercel environment variables via the Vercel API.
 * Usage: node scripts/set-vercel-env.mjs
 */

import * as readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

const PROJECT_NAME = 'wvw-dashboard';
const ENVIRONMENTS = ['production', 'preview', 'development'];

async function getProjectId(token) {
  const res = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_NAME}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Could not find project: ${data.error?.message ?? JSON.stringify(data)}`);
  return data.id;
}

async function setEnvVar(token, projectId, key, value) {
  // First try to delete existing var to avoid conflicts
  const listRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listData = await listRes.json();
  const existing = (listData.envs ?? []).filter((e) => e.key === key);
  for (const e of existing) {
    await fetch(`https://api.vercel.com/v9/projects/${projectId}/env/${e.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Create new
  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value, type: 'encrypted', target: ENVIRONMENTS }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? JSON.stringify(data));
  return true;
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  WVW Vercel Environment Variable Setup');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('  Get your token at: vercel.com/account/tokens\n');

const token = (await ask('  Paste your Vercel personal access token: ')).trim();

let projectId;
try {
  projectId = await getProjectId(token);
  console.log(`\n  ✓ Found project: ${PROJECT_NAME} (${projectId})\n`);
} catch (err) {
  console.error('\n  ✗ ' + err.message);
  rl.close();
  process.exit(1);
}

console.log('  Enter each value below. Press Enter to skip a variable (keeps existing value).\n');

const VARS = [
  { key: 'ANTHROPIC_API_KEY',      label: 'Anthropic API Key (sk-ant-api03-...)' },
  { key: 'TWILIO_ACCOUNT_SID',     label: 'Twilio Account SID (AC...)' },
  { key: 'TWILIO_AUTH_TOKEN',      label: 'Twilio Auth Token' },
  { key: 'TWILIO_FROM_NUMBER',     label: 'Twilio Phone Number (+1XXXXXXXXXX)' },
  { key: 'USER_PHONE_NUMBER',      label: 'Your Cell Number (+1XXXXXXXXXX)' },
  { key: 'RESEND_API_KEY',         label: 'Resend API Key (re_...)  [optional]' },
  { key: 'NOTIFY_EMAIL',           label: 'Notification email address  [optional]' },
];

const results = [];

for (const v of VARS) {
  const value = (await ask(`  ${v.label}:\n  → `)).trim();
  if (!value) {
    console.log('    skipped\n');
    results.push({ key: v.key, status: 'skipped' });
    continue;
  }
  try {
    await setEnvVar(token, projectId, v.key, value);
    console.log(`    ✓ ${v.key} saved\n`);
    results.push({ key: v.key, status: 'saved' });
  } catch (err) {
    console.error(`    ✗ Failed: ${err.message}\n`);
    results.push({ key: v.key, status: 'error', error: err.message });
  }
}

rl.close();

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
results.forEach((r) => {
  const icon = r.status === 'saved' ? '✓' : r.status === 'skipped' ? '—' : '✗';
  console.log(`  ${icon} ${r.key} ${r.status === 'error' ? '— ' + r.error : ''}`);
});

const saved = results.filter((r) => r.status === 'saved').length;
if (saved > 0) {
  console.log(`\n  ${saved} variable${saved !== 1 ? 's' : ''} saved. Redeploy Vercel to apply:\n`);
  console.log('  npx vercel --prod\n');
}
