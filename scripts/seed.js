#!/usr/bin/env node
/**
 * Seed script for generating the 8-week base plan for a given user.
 *
 * Usage:
 *   node scripts/seed.js <user_id> [start_date]
 *
 * The script will POST to the /api/plan/seed endpoint of your deployed
 * application using the APP_BASE_URL and CRON_SECRET environment variables.
 */
const [,, userId, startDate] = process.argv;

if (!userId) {
  console.error('Usage: node scripts/seed.js <user_id> [start_date YYYY-MM-DD]');
  process.exit(1);
}

async function run() {
  const baseUrl = process.env.APP_BASE_URL;
  const secret = process.env.CRON_SECRET;
  if (!baseUrl || !secret) {
    console.error('APP_BASE_URL and CRON_SECRET must be set in your environment');
    process.exit(1);
  }
  const url = `${baseUrl.replace(/\/$/, '')}/api/plan/seed`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId, start_date: startDate }),
  });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
