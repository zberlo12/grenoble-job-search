'use strict';

/**
 * scripts/db.js — shared DB access for every skill in .claude/commands/.
 * Replaces the ~65-line Step 0 boilerplate that used to be copy-pasted into
 * each skill file (direct node -e Postgres calls + REST fallback + the
 * Supabase-paused diagnostic).
 *
 * Usage:
 *   node scripts/db.js query  "<SQL>" '<JSON params array>'
 *   node scripts/db.js health
 *
 * REST fallback (remote triggers where TCP 5432/6543 is blocked — set
 * SUPABASE_URL and SUPABASE_KEY env vars to switch modes automatically):
 *   node scripts/db.js select "<table>" "<querystring>"
 *   node scripts/db.js insert "<table>" '<JSON row>'
 *   node scripts/db.js update "<table>" "<filter querystring>" '<JSON patch>'
 *   node scripts/db.js upsert "<table>" '<JSON row>'
 *
 * Credentials: currently read from config.json (pg_module_path,
 * supabase_connection_string, supabase_url) — Phase 0 of the improvement
 * plan will move these into an out-of-tree .env file; when that lands, only
 * loadConfig() below needs to change, not any caller.
 *
 * On a direct-Postgres connection failure, this does NOT retry in a loop.
 * It checks once whether the Supabase project is paused (a curl to the REST
 * root; 401 = active/transient failure, retry once; anything else = paused,
 * exit non-zero with instructions). Never disables TLS verification.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

function loadConfig() {
  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  const envConn = process.env.PG_CONN || process.env.SUPABASE_CONNECTION_STRING;
  if (envConn) cfg.supabase_connection_string = envConn;
  return cfg;
}

const REST_TABLE_RE = /^[a-z_][a-z0-9_]*$/;

function assertRestTable(table) {
  if (!REST_TABLE_RE.test(table)) {
    console.error('Invalid table name for REST mode.');
    process.exit(1);
  }
}

function isRestMode() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);
}

async function checkPaused(supabaseUrl) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, { signal: AbortSignal.timeout(8000) });
    return res.status !== 401; // 401 = active; anything else = likely paused
  } catch {
    return true; // no response at all = paused
  }
}

function pausedMessage() {
  return 'Supabase project looks paused — resume it at https://supabase.com/dashboard, then try again.';
}

async function connectWithDiagnostic(client, cfg) {
  try {
    await client.connect();
    return;
  } catch (err) {
    const paused = await checkPaused(cfg.supabase_url);
    if (paused) {
      console.error(pausedMessage());
      process.exit(1);
    }
    // Project is active (401 on REST root) — the failure was transient, retry once.
    await client.connect();
  }
}

async function runQuery(sql, params) {
  const cfg = loadConfig();
  const { Client } = require(cfg.pg_module_path);
  const client = new Client({ connectionString: cfg.supabase_connection_string });
  await connectWithDiagnostic(client, cfg);
  try {
    const result = await client.query(sql, params);
    console.log(JSON.stringify(result.rows));
  } finally {
    await client.end();
  }
}

async function runHealth() {
  if (isRestMode()) {
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: process.env.SUPABASE_KEY, Authorization: `Bearer ${process.env.SUPABASE_KEY}` },
    }).catch(() => null);
    if (res && res.status === 200) { console.log('ok (rest)'); return; }
    console.error(pausedMessage());
    process.exit(1);
  }
  const cfg = loadConfig();
  const { Client } = require(cfg.pg_module_path);
  const client = new Client({ connectionString: cfg.supabase_connection_string });
  await connectWithDiagnostic(client, cfg);
  await client.end();
  console.log('ok (direct)');
}

function restHeaders(extra) {
  return {
    apikey: process.env.SUPABASE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
    ...extra,
  };
}

async function restSelect(table, qs) {
  assertRestTable(table);
  const url = `${process.env.SUPABASE_URL}/rest/v1/${table}?${qs}`;
  const res = await fetch(url, { headers: restHeaders() });
  console.log(await res.text());
  if (!res.ok) process.exit(1);
}

async function restInsert(table, jsonRow) {
  assertRestTable(table);
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: restHeaders({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
    body: jsonRow,
  });
  console.log(await res.text());
  if (!res.ok) process.exit(1);
}

async function restUpdate(table, filterQs, jsonPatch) {
  assertRestTable(table);
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}?${filterQs}`, {
    method: 'PATCH',
    headers: restHeaders({ 'Content-Type': 'application/json' }),
    body: jsonPatch,
  });
  console.log(await res.text());
  if (!res.ok) process.exit(1);
}

async function restUpsert(table, jsonRow) {
  assertRestTable(table);
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: restHeaders({
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    }),
    body: jsonRow,
  });
  console.log(await res.text());
  if (!res.ok) process.exit(1);
}

async function main() {
  const [cmd, a, b] = process.argv.slice(2);

  if (cmd === 'query') {
    const params = b ? JSON.parse(b) : [];
    return runQuery(a, params);
  }
  if (cmd === 'health') return runHealth();

  if (!isRestMode()) {
    console.error(`"${cmd}" requires REST mode (SUPABASE_URL + SUPABASE_KEY env vars). Use "query" for direct Postgres.`);
    process.exit(1);
  }
  if (cmd === 'select') return restSelect(a, b || '');
  if (cmd === 'insert') return restInsert(a, b);
  if (cmd === 'update') {
    const [, , filterQs, jsonPatch] = process.argv.slice(2);
    return restUpdate(a, filterQs, jsonPatch);
  }
  if (cmd === 'upsert') return restUpsert(a, b);

  console.error('Usage: node scripts/db.js <query|health|select|insert|update|upsert> ...');
  process.exit(1);
}

main().catch(e => { console.error(e.message); process.exit(1); });
