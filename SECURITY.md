# Security

This repo stores personal job-search data in Supabase. Treat credentials and exports as sensitive.

## Credential storage (current)

| Secret | Where it should live | Never commit |
|--------|----------------------|--------------|
| Supabase DB password / connection URI | `config.json`, `config-<name>.json`, or `PG_CONN` in `.env.*` | Yes |
| Supabase REST keys | `SUPABASE_URL` + `SUPABASE_KEY` env (REST fallback for `scripts/db.js`) | Yes |
| Notion integration token | `.mcp.json` or `NOTION_API_TOKEN` in `.env.*` | Yes |
| France Travail OAuth | `france_travail_api` in config JSON | Yes |

Copy `config.example.json` → `config.json` (or use `/job-user-setup`). Per-user snapshots: `config-<name>.json` + `/job-user-select`.

## If credentials were ever pushed to GitHub

The database password appeared in git history (tracked `config-*.json`, legacy archive scripts, and `.claude/settings.local.json`). **Assume compromise.**

1. **Rotate the Supabase database password** — Dashboard → Project Settings → Database → reset password, then update every local `config*.json` and `PG_CONN`.
2. **Rotate France Travail client secret** if it was ever in a committed config file.
3. **Optional history purge** — `git filter-repo` or BFG to remove secrets from history, then force-push (coordinate with anyone else using the repo).
4. **Revoke LinkedIn session links** — delete local email dumps (`extract*.txt`); they can contain `otpToken` / tracking parameters.

## Data in the repo

- **`archive/data-exports/`** — may contain PII from past exports; do not republish.
- **`outputs/`** — generated CVs/CLs; gitignored for docx/pdf.
- **Supabase** — schema has no Row Level Security; access control is “whoever holds the DB password / service role key”. Acceptable for a private single-project setup; enable RLS before exposing PostgREST to untrusted clients.

## Tooling hardening

- `scripts/db.js` — prefers `PG_CONN` / `SUPABASE_CONNECTION_STRING` over config file; REST table names validated.
- Legacy scripts under `archive/` — use `scripts/pg_conn_helper.js` instead of inline URIs.

## Local-only files (gitignored)

- `config.json`, `config-*.json`
- `.env`, `.env.*` (except `.env.template`)
- `.mcp.json`
- `.claude/settings.local.json`
- `extract*.txt` (raw email captures)
