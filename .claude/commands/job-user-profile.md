---
description: Update user profile and configuration. config.json fields (salary floor, location zones, job titles, Gmail sources) via Bash. Candidate Profile page in Notion (experience, metrics, cover letter rules, tone) via notion-update-page. Trigger with /job-user-profile or when the user says "update my profile" or "change my salary / location / skills".
argument-hint: Optional. Describe what to update (e.g. "salary floor" or "add job title CFO"). Leave blank to see the full menu.
allowed-tools: mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-update-page, Bash
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

config.json (instant, no Notion needed):
  1. Salary floors        — minimum to apply / hard-reject threshold
  2. Location zones       — Green / Yellow / Orange / Red city lists
  3. Job titles           — alert keywords for searches
  4. Gmail sources        — alert sender addresses
  5. CV approaches        — approach definitions and flags
  6. Lifecycle rules      — dedup window, auto-expiry days

Notion Candidate Profile (long-form content):
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

### Sections 7–10 (Notion Candidate Profile)

Load the page ID from config.json: `notion.candidate_profile_id`. Then:
1. `notion-fetch` the Candidate Profile page to read the current content.
2. Show the relevant section to the user.
3. Ask for the updated content.
4. `notion-update-page` to append or replace the relevant section.

**Section 7 — Experience & metrics:**
- Show current metrics and achievements.
- Ask: "What new achievement or metric should I add?"
- Append under the appropriate experience section.

**Section 8 — Cover letter rules:**
- Show current rules.
- Ask: "What rule to add, change, or remove?"
- Update the Cover Letter Writing Rules section.

**Section 9 — Writing tone:**
- Show current Writing Tone Profile.
- Ask: "What aspect of your tone should change?"
- Update the relevant tone fields.

**Section 10 — Background keywords:**
- Show current skills, systems, languages, employers.
- Ask: "What to add or update?"
- Update the Background Keywords section.

Confirm: "Done — Candidate Profile updated in Notion. The change takes effect immediately for /job-apply and /job-interview-prep."

---

## Notes

- Multiple changes in one session: after each update, ask "Anything else to update?"
- config.json changes are local — the file is gitignored, so they stay on this machine.
- Notion Candidate Profile changes are synced to Notion and visible immediately.
