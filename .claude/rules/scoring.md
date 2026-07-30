# Scoring Rules — Single Source of Truth

Read this file before scoring any listing, in every skill that ranks or routes a listing:
`/job-search`, `/job-search-daily-scan`, `/job-search-indeed`, `/job-search-target-companies`, `/job-review`.

**Every threshold below is a reference to a `config.json` key — never hardcode a number or a city list inline.** If a skill needs a value from here, it reads it from config at Step 0, the same way it already reads `salary_floor_apply`. If this file and `config.json` ever disagree, config.json wins — flag the mismatch and fix this file, don't silently follow the stale copy.

---

## 1. Location Zones

Source: `config.json` → `location_zones` (`green` / `yellow` / `orange` / `red`, each with `cities[]` and `departments[]`).

| Zone | Commute | Rule |
|---|---|---|
| 🟢 Green | 0–25 min | Daily on-site fine — no condition |
| 🟡 Yellow | 30–50 min | Apply — confirm hybrid before drafting documents |
| 🟠 Orange | 1h–1h45 | Only apply if explicitly hybrid ≤2 days/week |
| 🔴 Red | 1h15+, no hybrid | Skip without hesitation |
| 🌐 Remote | Any location | Assess on role fit alone |

Special cases:
- Dept 73 (Savoie): check the specific town, not just the department — Chambéry = Yellow, Maurienne valley = Red.
- **Lyon is Orange** (per config) — never Red. This was a real drift bug: two skills auto-dismissed every Lyon listing while config said assess it.

---

## 2. Rescue Gate (apply before standard ranking)

**Operational/non-finance gate — check first:**
If the role is operational, logistics, supply chain, manufacturing, or non-finance project management (i.e. not primarily a finance/accounting/controlling title) → route to `review_queue`, `status='Needs Info'`, `priority='B'`, `notes` starts with `'OPERATIONAL ROLE — review for fit'`. Never dismiss on this gate.

**Standard rescue gate:**
If ALL of the following are true:
1. Title family matches (Finance Director, FP&A, Controlling, P2P, Supply Chain Finance, Procurement at senior level, Financial Analyst, CDG, RAF, DAF, Chef Comptable, Trésorerie, Audit, SSC, Project Manager Finance/ERP)
2. Location is 🟢 Green, 🟡 Yellow, or 🌐 Remote
3. No hard disqualifier (see §4)

...AND any of Salary, Hybrid policy, Full scope, or Company name is missing → route to `review_queue`, `status='Needs Info'`, `priority='B'` (provisional), `missing_info` = list of missing fields.

**Tiebreaker:** when genuinely unclear, always route to Needs Info. Only assign Dismissed when a disqualifier is unambiguous.

---

## 3. Priority Criteria (fully-populated listings only)

- 🟢 **A** — Senior finance/FP&A/controlling title match, 🟢 Green / 🟡 Yellow / 🌐 Remote zone, CDI, English exposure, salary ≥ `user.salary_floor_apply` (config, currently €65,000) → `job_applications`, `status='To Apply'`.
- 🟡 **B** — Good fit on 3 of 4 criteria, or a Tier A/B target company with one weakness → `review_queue`, `status='To Assess'`.
- 🔴 **C** — Multiple mismatches or one disqualifying factor → `review_queue`, `status='To Assess'`.
- ⛔ **Skip / Dismissed** — Any hard disqualifier (§4) → `job_applications`, `status='Dismissed'`, populate `red_flags`, `notes='Auto-dismissed: [reason]'`. Operational/logistics/supply-chain/PM roles are **never** auto-dismissed — the operational gate in §2 always fires first and wins.

---

## 4. Hard Disqualifiers

Shared by both the rescue gate (§2) and Skip/Dismissed (§3) — a listing failing any of these never gets the Needs Info benefit of the doubt:

- **Location** — Red-zone city, on-site only, no hybrid confirmed.
- **Seniority** — explicitly entry-level / ≤3 years required.
- **Salary** — explicitly stated below `user.salary_floor_reject` (config, currently €52,000).
- **Function** — truly unrelated role (IT development, medical, marketing, HR professional, legal, education).

---

## 5. Deduplication

Source: `lifecycle_rules.dedup_window_days` (config, currently 30 days).

Check both `job_applications` and `review_queue`, scoped to `user_profile`, within the dedup window:
1. **URL exact match** — `job_url = $1` — hard dedup, always wins.
2. **Company + title-root match (ILIKE)** — strip H/F, "(multi-sites)", seniority suffixes, and parenthetical qualifiers from the title before matching; keep the primary role noun phrase (e.g. "Responsable Administratif Financier", "Contrôleur de Gestion").

If either check returns a row → duplicate. Do not re-score, do not re-insert.

---

## 6. Source-specific overrides (kept local, not consolidated)

These stay in their own skill file — they're genuinely source-specific, not scoring drift:

- **`/job-search-indeed`** — adjacent-title recognition: roles like "Responsable de Gestion", "Gestionnaire Financier Senior", "Finance & Operations Manager" that don't literally match a title in §2 but plausibly are finance leadership. Check role content before skipping on title alone.
- **`/job-search-daily-scan`** — the operational-role gate (§2) matters most here, since Gmail alerts surface a wider net of adjacent-function roles than a manual paste or a targeted Indeed search does.
- **`/job-review`** — the rescue gate (§2) does **not** reapply during re-ranking (its Step 3). An enriched row gets a final A/B/C/Skip from §3 alone, using the freshly-completed data.
