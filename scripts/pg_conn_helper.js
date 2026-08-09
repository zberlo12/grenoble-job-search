'use strict';

/**
 * Resolve Postgres connection string without embedding credentials in scripts.
 * Priority: PG_CONN env → config.json supabase_connection_string (walk up to repo root).
 */

const fs = require('fs');
const path = require('path');

function findRepoRoot(startDir) {
  let d = path.resolve(startDir);
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(d, 'config.json'))) return d;
    const parent = path.dirname(d);
    if (parent === d) break;
    d = parent;
  }
  throw new Error(
    'config.json not found — set PG_CONN or run from the repo with config.json present'
  );
}

function getConnectionString(fromDir = __dirname) {
  if (process.env.PG_CONN) return process.env.PG_CONN;
  const root = findRepoRoot(fromDir);
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config.json'), 'utf-8'));
  const conn = cfg.supabase_connection_string;
  if (!conn) throw new Error('supabase_connection_string missing in config.json');
  return conn;
}

module.exports = { getConnectionString, findRepoRoot };
