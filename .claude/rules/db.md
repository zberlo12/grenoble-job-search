# Database Access

All DB access goes through `scripts/db.js` — never inline `node -e` Postgres calls.

**Direct (default):**
```bash
node scripts/db.js query "<SQL>" '<JSON params array>'
node scripts/db.js health
```
Prints `JSON.stringify(rows)` to stdout; non-zero exit + stderr message on failure.

**REST fallback (remote triggers, when `SUPABASE_URL`/`SUPABASE_KEY` env vars are set instead of config.json):**
```bash
node scripts/db.js select "<table>" "<querystring>"
node scripts/db.js insert "<table>" '<JSON row>'
node scripts/db.js update "<table>" "<filter querystring>" '<JSON patch>'
node scripts/db.js upsert "<table>" '<JSON row>'
```
Querystring filters use PostgREST syntax: `col=eq.val`, `col=ilike.*val*`, `col=gte.val`, `col=in.(a,b)`, joined with `&`.

**Paused-project handling is automatic** — on a direct-connect failure, `db.js` checks once whether Supabase is paused and reports it; it never retries in a loop or disables TLS. If you see "Supabase project looks paused", tell the user to resume it at supabase.com/dashboard — do not attempt workarounds.
