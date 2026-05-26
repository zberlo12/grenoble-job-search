---
description: Update user profile and configuration. config.json fields (salary floor, location zones, job titles, Gmail sources) via Bash. candidate_profile table in Postgres (experience, metrics, cover letter rules, tone) via SQL. Trigger with /job-user-profile or when the user says "update my profile" or "change my salary / location / skills".
argument-hint: Optional. Describe what to update (e.g. "salary floor" or "add job title CFO"). Leave blank to see the full menu.
allowed-tools: Bash
---

# Profile Update

## Step 1 — Load current config

Run `cat config.json` via Bash to load all current values.
Also run `cat config.json | node -e "const c=require('fs').readFileSync('/dev/stdin','utf8'); const j=JSON.parse(c); console.log(JSON.stringify(j,null,2));"` if you need it prettied.

If config.json is not found, halt: "config.json not found — run /job-user-setup to initialise your profile first."

---

## Step 2 — Identify what to update

If `$ARGUMENTS` is provided, interpret it as a natural-language update request and map to the appropriate section below.

If no arguments, show the full menu:

```
Profile sections you can update:

config.json (instant):
  1. Salary floors        — minimum to apply / hard-reject threshold
  2. Location zones       — Green / Yellow / Orange / Red city lists
  3. Job titles           — alert keywords for searches
  4. Gmail sources        — alert sender addresses
  5. CV approaches        — approach definitions and flags
  6. Lifecycle rules      — dedup window, auto-expiry days

candidate_profile table (long-form content):
  7. Experience & metrics  — key achievements, quantified results
  8. Cover letter rules    — writing constraints for all future CLs
  9. Writing tone          — formality, voice, avoid list
  10. Background keywords  — skills, systems, languages, employers

Type a number or describe the change.
```

---

## Step 3 — Make the change

### Sections 1–6 (config.json)

For the relevant section, show the current value first so the user can see what they're changing, then ask for the new value.

Example:
> "Your current salary floor is €55,000. What would you like to change it to?"

After receiving the new value, update config.json via Bash using node:

```bash
node -e "
const fs=require('fs');
const cfg=JSON.parse(fs.readFileSync('config.json','utf8'));
// apply the change here — e.g. cfg.user.salary_floor_apply=60000;
fs.writeFileSync('config.json',JSON.stringify(cfg,null,2));
console.log('OK');
"
```

**Section-specific guidance:**

**Section 1 — Salary floors:**
- `user.salary_floor_apply` → minimum to actually apply (used in pre-flight check in /job-apply)
- `user.salary_floor_reject` → hard-reject threshold (used in analysis step)
- When changing: also check `lifecycle_rules.salary_floor_apply` — update both if they differ.

**Section 2 — Location zones:**
- Show current lists for all four zones.
- Ask: "What city are you adding, and which zone? (Green / Yellow / Orange / Red)"
- For city additions: suggest sensible zone based on geography, then confirm before saving.
- Update `location_zones.green[]`, `location_zones.yellow[]`, `location_zones.orange[]`, or `location_zones.red[]` accordingly.

**Section 3 — Job titles:**
- Show current list.
- Ask: "Which titles to add or remove?"
- For additions: suggest related titles the user might have missed, based on what they're adding.
- Update `job_titles[]` array.

**Section 4 — Gmail sources:**
- Show current `gmail.alert_sources` list.
- Ask: "Which sender address to add or remove?"
- Update `gmail.alert_sources[]` array.

**Section 5 — CV approaches:**
- Show current `cv_approaches[]` list (id, name, flag, description).
- Ask what to change (add new approach, update description, change flag).
- Update the relevant entry.

**Section 6 — Lifecycle rules:**
- Show current `lifecycle_rules` (dedup_window_days, auto_expiry_days).
- Ask for new values.

Confirm after each update: "Done — [what changed]. The change takes effect immediately for all skills."

---

### Sections 7–10 (candidate_profile table)

Query the current values first via Bash, then UPDATE the relevant column.

```bash
# Read current candidate_profile row
PG_MODULE="<pg_module_path>" PG_CONN="<supabase_connection_string>" node -e "
const {Client}=require(process.env.PG_MODULE);
const c=new Client({connectionString:process.env.PG_CONN});
c.connect()
  .then(()=>c.query('SELECT experience_summary,fp_and_a_highlights,cost_control_highlights,p2p_highlights,cl_rules,tone_profile FROM candidate_profile WHERE user_email=\$1',['<user_email>']))
  .then(r=>{console.log(JSON.stringify(r.rows[0],null,2));return c.end();})
  .catch(e=>{console.error(e.message);process.exit(1);});
"
```

**Section 7 — Experience & metrics:**
- Show current `experience_summary`, `fp_and_a_highlights`, `cost_control_highlights`, `p2p_highlights`.
- Ask: "What new achievement or metric should I add?"
- UPDATE the relevant column, appending the new content.

**Section 8 — Cover letter rules:**
- Show current `cl_rules`.
- Ask: "What rule to add, change, or remove?"
- UPDATE `cl_rules` with the revised full text.

**Section 9 — Writing tone:**
- Show current `tone_profile`.
- Ask: "What aspect of your tone should change?"
- UPDATE `tone_profile` with the revised full text.

**Section 10 — Background keywords:**
- Show current `experience_summary` keywords section and config.json `background` arrays.
- Ask: "What to add or update?"
- UPDATE `candidate_profile` column and/or config.json `background` arrays as appropriate.

```bash
# Write updated value (example — substitute column and value)
PG_MODULE="<pg_module_path>" PG_CONN="<supabase_connection_string>" node -e "
const {Client}=require(process.env.PG_MODULE);
const c=new Client({connectionString:process.env.PG_CONN});
c.connect()
  .then(()=>c.query('UPDATE candidate_profile SET <column>=\$1, updated_at=NOW() WHERE user_email=\$2',['<new_value>','<user_email>']))
  .then(()=>{console.log('OK');return c.end();})
  .catch(e=>{console.error(e.message);process.exit(1);});
"
```

Confirm: "Done — Candidate Profile updated in database. The change takes effect immediately for /job-apply and /job-interview-prep."

---

## Notes

- Multiple changes in one session: after each update, ask "Anything else to update?"
- config.json changes are local — the file is gitignored, so they stay on this machine.
- candidate_profile changes write directly to Supabase and are visible immediately.
