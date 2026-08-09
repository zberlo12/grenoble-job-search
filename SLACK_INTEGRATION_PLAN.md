# Slack Integration Plan

## What this is

A phased plan for turning Zack's connected-but-unused Slack workspace into a notification and capture layer for this job search system. Slack is single-user here (no team), so the point isn't communication — it's push notifications the Gmail digest and the Cowork dashboard can't give (nobody gets tapped on the shoulder by an unopened Gmail draft or a dashboard that has to be opened to matter), plus a lower-friction way to capture a listing from a phone.

**Read this if you're Claude Code working in this repo:** most of the execution below happens on the Cowork side (Anthropic's desktop agent, connected to this Supabase project and to Slack via MCP), not through you. You're not expected to build Slack integration code into `.claude/commands/`. This document exists so you understand what's running against the same database you write to, so nothing here surprises you or gets silently duplicated. The one thing that *does* touch your side is Phase 2, flagged below.

## Where each piece runs

| | Runs in | Writes to DB via | Notes |
|---|---|---|---|
| Phase 0 | Cowork | — | No DB access, just Slack + repo docs |
| Phase 1 | Cowork (scheduled task) | Supabase MCP, read-only | Never touches `scripts/db.js` — it's not a skill, it's an external automation reading the same data |
| Phase 2 | Cowork, following this repo's rules | Supabase MCP, read + write | Must reuse `.claude/rules/scoring.md` and the dedup logic in `.claude/rules/scoring.md` §5 exactly — see Phase 2 notes |
| Phase 3 | Merged into Phase 1 | — | Slack Canvas needs a paid plan; not built |

None of this replaces `scripts/db.js` as the write path for anything inside `.claude/commands/`. It's a second, independent consumer of the same Supabase project — same rule as the Supabase MCP entry already documented in `CLAUDE.md`: useful for reading and, in Phase 2's case, carefully-scoped writing, but it isn't where the canonical pipeline logic lives. Scoring logic lives in exactly one place — `scoring.md` — regardless of which side (Cowork or Claude Code) is doing the scoring.

---

## Phase 0 — Foundation *(one-time setup)*

**Step 1.** Create a dedicated private Slack channel (not a DM-to-self, not `#general`) to house every notification and canvas from this project — e.g. `#job-search-grenoble`. Keeps this fully separated from anything else Zack might eventually use the workspace for.

**Step 2.** Confirm Cowork's scheduled-task capability is reachable and will run unattended (this is the same mechanism `OVERVIEW.md`'s "Scheduling" section notes was never actually kept active for the Gmail/RemoteTrigger path — worth not repeating that mistake here).

**Step 3.** Document the integration in this repo:
- `OVERVIEW.md` → add Slack to the "Tech stack" line
- `CLAUDE.md` → new bullet under "MCP Integrations" describing Slack the same way the Supabase MCP entry is described (what it's for, that it's Cowork-side, that it isn't a new skill)

No database writes in this phase.

---

## Phase 1 — Attention-needed push notifications *(daily, once Phase 0 is done)* — ✅ built

Live as of 2026-08-09: Cowork scheduled task `job-search-slack-digest`, runs daily at 08:07 local time, posts to `#job-search-grenoble`. Read-only — never writes to any table. Source of truth for the prompt: `C:\Users\zberl\Claude\Scheduled\job-search-slack-digest\SKILL.md`.

**Step 4.** A scheduled Cowork task runs each morning and checks:
- `review_queue` — anything sitting there, priority and count
- `networking_contacts` — any `next_followup` that's today or overdue
- `france_travail_log` — count of `statut_declaration = 'A declarer'` (see the accent-normalization fix already in flight for this column)

**Step 5.** Posts one short digest message to the Phase 0 channel — only what needs a decision, not a restate of the whole pipeline (that's what the dashboard artifact is for). Start as a daily digest rather than event-by-event delta alerts (simpler, no "last seen" state to track); revisit if it turns out to be noisy or too quiet.

**Decision needed before building:** what counts as "worth pinging about" — e.g. is a `review_queue` count of 1 worth a message, or only above some threshold? Recommend starting low-threshold and dialing back if it gets annoying, rather than the reverse.

---

## Data model & workflow adjustments *(prompted by having a live outlet now)*

Building a real-time outlet surfaces two kinds of gaps that a once-in-a-while manual check tolerates but daily automation doesn't: dirty data (wrong counts) and missing data (nothing to alert on). Concretely:

1. **`france_travail_log.statut_declaration` canonical values** — the accent-normalization cleanup (`'À déclarer'` → `'A declarer'`) fixes the existing rows, but nothing stops a future write from reintroducing the accented spelling. Once the cleanup has run and `SELECT statut_declaration, COUNT(*) FROM france_travail_log GROUP BY statut_declaration` shows a single `A declarer` bucket, add a constraint to make drift impossible rather than just fixed-for-now:
   ```sql
   ALTER TABLE france_travail_log
     ADD CONSTRAINT statut_declaration_canonical
     CHECK (statut_declaration IN ('A declarer', 'Déclaré', 'Exclu'));
   ```
   Note `'Déclaré'` still carries an accent — left as-is here since only the `déclarer`/`declarer` split was actually agreed on; if the same no-accent rule should extend to `'Déclaré'` → `'Declare'`, that's a separate decision, not bundled into this constraint.

2. **`networking_contacts.next_followup` mostly NULL** — 6 of 7 contacts had no follow-up date, which meant Phase 1's follow-up section had almost nothing to check against. Fixed directly in `/job-networking`: both "log a conversation" and "add a new contact" now default to 2 weeks out instead of leaving it blank, "skip" reserved for genuine dead ends.

3. **Digest fatigue / notified-state tracking** — deliberately *not* built yet. Phase 1 currently re-reports the full current backlog every morning rather than only what's new since yesterday. Adding a `last_notified_at` column (or a small log table) to make it delta-based is straightforward if the daily digest turns out to be repetitive — but that's a real trade-off (delta alerts can let something silently age in the queue if it's easy to miss one digest), so wait for a week of real digests before deciding.

4. **Phase 2 idempotency — deliberately schema-free.** Avoiding double-processing the same Slack DM doesn't need a new Supabase column: mark each DM processed with a ✅ reaction (`slack_add_reaction`) after triage, and only look at un-reacted messages on the next run. Listing-level dedup (has this exact job already been logged) still goes through the existing `scoring.md` §5 rules against `job_applications`/`review_queue` — no new mechanism needed there either.

5. **Source provenance for Slack-captured listings** — no schema change needed; `source` is already a free-text column on `listing_inbox`/`review_queue`/`job_applications`. Phase 2 should just write `source = 'Slack DM'` consistently so `/job-analytics`'s source-quality breakdown stays accurate once a second capture channel exists.

---

## Phase 2 — Quick capture from Slack *(after Phase 1 is stable)* — ✅ built

Live as of 2026-08-09: Cowork scheduled task `job-search-slack-quick-capture`, runs every 30 min between 07:00–23:00 local time. Two-pass design using Slack reactions as the state machine (no new Supabase columns): "eyes" = proposal posted awaiting decision, "question" = needs more info from Zack, "package" = saved, "wastebasket" = discarded. Scoring logic is never duplicated — each run reads `.claude/commands/job-search.md` and `.claude/rules/scoring.md` fresh and applies them verbatim, swapping only `scripts/db.js` for the Supabase MCP's `execute_sql` (this task runs outside Claude Code) and tagging every row `source = 'Slack DM'`. Writes only happen after an explicit ✅ from Zack on the bot's threaded proposal — see Prompt source: `C:\Users\zberl\Claude\Scheduled\job-search-slack-quick-capture\SKILL.md`.

**Step 6.** Zack DMs a job posting (link or pasted text) to himself in the workspace.

**Step 7.** A scheduled task reads new DMs, and for each listing runs the *same* rescue-gate and priority scoring as `/job-search` — meaning it reads `.claude/rules/scoring.md` fresh each time rather than encoding its own copy of the location zones / disqualifiers / priority thresholds. This is the one place in this plan with real drift risk: `CLAUDE.md` already documents a real incident (the Lyon zone bug) caused by two skills disagreeing about scoring rules. A third, Cowork-side scorer is exactly the kind of thing that causes that bug again if it's not built to read the same source of truth.

**Step 8.** Before inserting, apply the dedup check in `scoring.md` §5 (URL exact match, then company + title-root match) against both `job_applications` and `review_queue` — otherwise a listing that arrives by Slack DM *and* later by Gmail alert becomes two rows.

**Step 9.** Routes to `review_queue` or `job_applications` exactly as `/job-search` would, via the Supabase MCP.

**Recommendation:** keep this phase semi-manual at first — post the proposed A/B/C ranking back to Slack as a thread reply for a thumbs-up before writing, rather than auto-committing. Once that's been reliable for a couple of weeks, remove the confirmation step if it feels safe to.

---

## Phase 3 — Mobile status canvas *(polish, do last)* — ❌ blocked, merged into Phase 1

Slack Canvas is not available on Zack's free-tier workspace (`slack_create_canvas` fails with `not_supported_free_team`). Two real options existed: upgrade the Slack workspace to a paid plan and keep the original Canvas design, or fold the intended content into the Phase 1 digest instead. Chose the latter — as of 2026-08-09 the Phase 1 prompt now always includes a headline line (active applications, interviews, review queue size, France Travail backlog) on every run, not just on days something needs attention, so it doubles as the "living status" surface Phase 3 was meant to be. Trade-off: it's a new message each morning, not a single page you can reopen mid-day — if that starts to matter, revisit the paid-Slack-plan option.

---

## Open questions

1. ~~Notification threshold~~ — resolved: Phase 1 posts once daily regardless of backlog size, terse "all clear" line when there's nothing to flag, fuller digest otherwise. Revisit if it turns out too noisy or too quiet.
2. Should Phase 2 write automatically once it's proven reliable, or should it always require a thumbs-up reply? (Recommendation above: start with confirmation, relax later.)
3. Retention — does the Slack channel history need any cleanup/archiving policy, or is it fine to let it grow indefinitely?
