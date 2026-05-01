---
description: Log and report job search actions for France Travail compliance. Auto-syncs from Job Applications and Networking DBs (Supabase), allows manual entries, and generates audit-ready reports tiered by reporting priority. Trigger with /job-france-travail or when Zack wants to log or review actions for France Travail / Pôle Emploi.
argument-hint: "add | sync | report | blank for interactive menu"
allowed-tools: mcp__claude_ai_Gmail__search_threads, mcp__claude_ai_Gmail__get_thread, mcp__claude_ai_Gmail__create_draft, Bash
---

## Purpose

Maintain an audit-ready log of all job search actions for France Travail compliance. If Zack is audited ("contrôlé"), this log provides dated proof of active job searching, organised by priority tier.

---

## Step 0 — Load Config

Run `cat config.json` via Bash. Parse the output and extract:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
- `user.name` → name
- `user.email` → email

**DB query pattern** — substitute actual `PG_MODULE` and `PG_CONN` values from config in every Bash call:
```bash
PG_MODULE="<pg_module_path>" PG_CONN="<supabase_connection_string>" node -e "
const {Client}=require(process.env.PG_MODULE);
const c=new Client({connectionString:process.env.PG_CONN});
c.connect()
  .then(()=>c.query('<SQL>',[<params>]))
  .then(r=>{console.log(JSON.stringify(r.rows));return c.end();})
  .catch(e=>{console.error(e.message);process.exit(1);});
"
```

**REST API mode (remote triggers):** When `SUPABASE_URL` and `SUPABASE_KEY` are provided via trigger config instead (TCP ports 5432/6543 are blocked in remote environments), skip `cat config.json` and use `curl` for all DB calls:

```bash
# SELECT
curl -s "SUPABASE_URL/rest/v1/<table>?<filters>&select=<cols>&order=<col>.<dir>&limit=<n>" \
  -H "apikey: SUPABASE_KEY" -H "Authorization: Bearer SUPABASE_KEY"

# INSERT (returns inserted row)
curl -s -X POST "SUPABASE_URL/rest/v1/<table>" \
  -H "apikey: SUPABASE_KEY" -H "Authorization: Bearer SUPABASE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '<JSON>'

# UPDATE
curl -s -X PATCH "SUPABASE_URL/rest/v1/<table>?<filter>" \
  -H "apikey: SUPABASE_KEY" -H "Authorization: Bearer SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '<JSON>'

# UPSERT (ON CONFLICT DO UPDATE)
curl -s -X POST "SUPABASE_URL/rest/v1/<table>" \
  -H "apikey: SUPABASE_KEY" -H "Authorization: Bearer SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates,return=representation" \
  -d '<JSON>'
```

Filter operators: `col=eq.val` · `col=ilike.*val*` · `col=gte.val` · `col=lt.val` · `col=in.(a,b)` · `col=not.in.(a,b)` — multiple filters ANDed with `&`.
UNION queries: run two separate GETs and treat as found if either returns results.

---

## Step 1 — Menu

**Language note:** All interaction with Zack (menus, prompts, questions, confirmations) is in English. French is used only in the output content — report entries, email body, and the 💬 commentaire FT copy-paste text.

If `$ARGUMENTS` is blank, ask the user to choose a mode:

```
France Travail Log — what would you like to do?

1. Sync    — import from Job Applications + Networking DBs
2. Add     — log a manual entry
3. Report  — view and triage entries for a period
4. All     — sync then show report
5. Stats   — week-by-week activity summary (posts considered vs applied)
```

Map responses to modes: `sync`, `add`, `report`, `stats`, or run sync then report.

If `$ARGUMENTS` is `add`, `sync`, `report`, or `stats`, go directly to that step.

---

## Step 2a — Sync mode

Pull from both source tables and create missing France Travail Log entries.

### From job_applications

```sql
SELECT id, job_title, company, status, date_applied, date_added, date_response, notes, job_url
FROM job_applications
WHERE status IN ('Docs Ready','Applied','Interview','Offer','Rejected')
ORDER BY COALESCE(date_applied, date_added) ASC
```

For each row, apply this mapping:

| Job Application status | FT action to create | Catégorie | Priorité | Date to use |
|---|---|---|---|---|
| Docs Ready | Candidature | Candidature | Obligatoire | date_applied or date_added |
| Applied | Candidature | Candidature | Obligatoire | date_applied |
| Interview | Candidature + Entretien | Candidature / Entretien | Obligatoire | Candidature: date_applied — Entretien: date_response or best date from notes |
| Offer | Candidature + Entretien | Candidature / Entretien | Obligatoire | Candidature: date_applied — Entretien: date_response |
| Rejected (date_applied set) | Candidature | Candidature | Obligatoire | date_applied — real submissions count |
| Rejected (no date_applied) | — | — | — | Skip — never submitted |

Action title format: `Candidature — [job_title] @ [company]` or `Entretien — [job_title] @ [company]`

Source: `Auto-Candidatures`. Job URL carried forward from job_applications.

### From networking_contacts

```sql
SELECT id, name, company, role, last_contact, notes
FROM networking_contacts
WHERE last_contact IS NOT NULL
ORDER BY last_contact DESC
```

For each row:
- Action title: `Contact réseau — [name] @ [company]`
- Catégorie: `Contact réseau`
- Priorité: `Impactant`
- Date: last_contact
- Source: `Auto-Réseau`

### Deduplication (before each INSERT)

```sql
SELECT id FROM france_travail_log
WHERE entreprise ILIKE $1
  AND categorie = $2
  AND date BETWEEN $3::date - INTERVAL '1 day' AND $3::date + INTERVAL '1 day'
```

If found → skip. Count skipped entries separately.

### INSERT for each new entry

```sql
INSERT INTO france_travail_log
(action, date, categorie, priorite, entreprise, poste_sujet, mode, source,
 statut_declaration, notes, job_application_id, contact_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'À déclarer', $9, $10, $11)
RETURNING id
```

All new entries default to `statut_declaration = 'À déclarer'`.
Pass `job_application_id` for candidature entries, `contact_id` for réseau entries, `NULL` otherwise.

### Sync summary

After processing, report:
```
Synchronisation terminée
─────────────────────────
Entrées créées :  X
Déjà existantes : Y
─────────────────────────
Sources : Z candidatures, W contacts réseau
```

---

## Step 2b — Add manual entry

Prompt the user in order (accept any format for date):

1. **Date de l'action** (e.g. "aujourd'hui", "15/04", "2026-04-10")
2. **Catégorie** — show numbered list:
   ```
   1. Candidature         (Obligatoire)
   2. Entretien           (Obligatoire)
   3. Contact recruteur   (Obligatoire)
   4. Contact réseau      (Impactant)
   5. Suivi candidature   (Impactant)
   6. Événement           (Impactant)
   7. France Travail      (Impactant)
   8. Formation           (Optionnel)
   9. CV · Profil         (Optionnel)
   10. Administratif      (Optionnel)
   11. Autre              (Optionnel)
   ```
3. **Entreprise / Organisme** (or "—" if not applicable)
4. **Poste / Sujet** (role title, course name, event name, etc.)
5. **Mode de contact** (Email / Téléphone / Visio / Présentiel / En ligne / Courrier)
6. **Notes** (optional — press Enter to skip)
7. **Déclarer à France Travail ?** — suggest based on Priorité:
   - If Obligatoire or Impactant: suggest `À déclarer`
   - If Optionnel: suggest `Exclu` but let Zack override to `À déclarer`

Auto-assign Priorité based on the category chosen (see mapping above).
Auto-generate the Action title: `[Catégorie] — [Poste/Sujet] @ [Entreprise]` (omit @ part if no Entreprise).
Source: `Manuel`.

Confirm before creating:
```
Créer cette entrée ?
  Date :              2026-04-15
  Catégorie :         Formation  (Optionnel)
  Entreprise :        Coursera
  Sujet :             Financial Modelling in Excel
  Mode :              En ligne
  Statut décl. :      Exclu
[O/N]
```

INSERT into france_travail_log:
```sql
INSERT INTO france_travail_log
(action, date, categorie, priorite, entreprise, poste_sujet, mode, source,
 statut_declaration, notes)
VALUES ($1, $2, $3, $4, $5, $6, $7, 'Manuel', $8, $9)
RETURNING id
```

Confirm: "Entry created (id=[id])."

---

## Step 2c — Report mode

Ask the user three questions:

**Période :**
1. This month ([current month])
2. Last month ([previous month])
3. All history
4. Custom period (ask for start and end date)
5. This week

**Profondeur :**
1. Obligatoire seulement — candidatures, entretiens, contacts recruteur
2. Obligatoire + Impactant — adds réseau, suivis, événements, FT meetings
3. Tout — complete log including formations, CV updates, admin

**Statut déclaration :**
1. À déclarer seulement — show what still needs to be entered into France Travail (default)
2. Déclaré seulement — show what has already been reported
3. Tout sauf Exclu — full history minus deliberately excluded entries
4. Tout — complete log including Exclu entries (audit view)

Build the SQL filter from these answers:

```sql
SELECT id, action, date, categorie, priorite, entreprise, poste_sujet, mode,
       source, statut_declaration, notes, job_application_id
FROM france_travail_log
WHERE date BETWEEN $1 AND $2
  AND priorite = ANY($3)           -- ['Obligatoire'] or ['Obligatoire','Impactant'] or all
  AND statut_declaration = ANY($4) -- ['À déclarer'] or ['Déclaré'] or ['À déclarer','Déclaré'] or all
ORDER BY date ASC
```

For job URL on Candidature entries, join to job_applications:
```sql
SELECT ft.*, ja.job_url
FROM france_travail_log ft
LEFT JOIN job_applications ja ON ft.job_application_id = ja.id
WHERE [same filters]
ORDER BY ft.date ASC
```

### Step 2c-i — Check for missing France Travail fields

Before generating the report, check each `À déclarer` entry against the required fields for its category (see **France Travail portal fields** section below). If any required fields are missing, prompt Zack to fill them in before continuing — do this in batch, one entry at a time:

```
Missing info for 2 entries:

[1/2] Candidature — Finance Director @ Schneider Electric (2026-04-10)
  Missing: Website / channel used
  → Indeed / LinkedIn / Company site / Direct email / APEC / Other?

[2/2] Candidature — FP&A Manager @ STMicroelectronics (2026-04-08)
  Missing: Website / channel used
  → ?
```

Save answers via UPDATE france_travail_log SET notes = COALESCE(notes,'') || ' FT: [answer]' WHERE id = $1.

### Step 2c-ii — Generate report with French comments

**Before rendering the report**, run two background queries for the period to populate the Positions Reviewed block:

```sql
-- Daily scan activity from scan_archive
SELECT SUM(total_found)::int AS total_scanned,
       SUM(potentially_apply + needs_info + to_assess)::int AS retained,
       SUM(dismissed)::int AS dismissed_scan
FROM scan_archive
WHERE scan_date BETWEEN $1 AND $2
```

```sql
-- Manual review activity from job_applications (review sessions + /job-review)
SELECT COUNT(*)::int AS total_reviewed,
       COUNT(*) FILTER (WHERE status = 'Dismissed')::int AS dismissed_review,
       COUNT(*) FILTER (WHERE status != 'Dismissed')::int AS kept_review
FROM job_applications
WHERE date_added::date BETWEEN $1 AND $2
```

For each entry, generate a **commentaire FT** — a concise French phrase (≤200 characters) ready to paste into the France Travail portal comment field. Use the templates in the **France Travail portal fields** section below.

Output format:

```
═══════════════════════════════════════════════════
FRANCE TRAVAIL — Rapport [Mois Année / Période]
Profondeur : [Obligatoire / Obligatoire + Impactant / Tout]
Statut :     [À déclarer / Déclaré / Tout sauf Exclu / Tout]
═══════════════════════════════════════════════════

OFFRES EXAMINÉES (recherche active)
─────────────────────────────────────
Offres trouvées via alertes :   X   (scans automatiques)
  dont retenues pour analyse :  X
  dont écartées d'emblée :      X
Offres examinées en revue :     X   (/job-review sessions)
  dont retenues :               X
  dont écartées :               X
─────────────────────────────────────
💬 Revue de X offres d'emploi — X retenues, X écartées.
     (copy-paste for France Travail portal Présélection entry)

RÉSUMÉ PAR CATÉGORIE
─────────────────────
Candidatures :        X  (X à déclarer, X déjà déclaré)
Entretiens :          X  (X à déclarer, X déjà déclaré)
Contacts recruteur :  X
Contacts réseau :     X
Formations :          X
Autres :              X
─────────────────────
TOTAL :               X actions  (X à déclarer)

ACTIONS À DÉCLARER
───────────────────
#1  2026-04-08  Candidature
    Schneider Electric — Finance Director
    Site : Indeed
    🔗 https://fr.indeed.com/viewjob?jk=XXXXXXX
    💬 Candidature au poste de Finance Director chez Schneider Electric via Indeed.

#2  2026-04-10  Entretien
    Raydiall — Finance Director
    Mode : Téléphone
    💬 Entretien téléphonique pour le poste de Finance Director chez Raydiall.

#3  2026-04-14  Contact réseau
    Alice Ferra — Raydiall
    Mode : Présentiel
    💬 Échange avec Alice Ferra (Raydiall) au sujet des opportunités finance.
...
```

If zero entries match, say so and suggest running a sync first.

### Step 2c-iii — Per-line triage

After displaying the full list, go through each `À déclarer` entry **one at a time** and ask Zack what to do with it. Collect all IDs for each decision as you go.

For each entry show a compact summary and three options:

```
#1  2026-04-08  Candidature — Finance Director @ Schneider Electric
    💬 Candidature au poste de Finance Director chez Schneider Electric via Indeed.

  [R] Report this week    → include in the email
  [D] Decide later        → leave as À déclarer for next time
  [X] Don't report        → mark Exclu (kept in log for audit)
```

Zack can respond with one letter per row (e.g. `1R 2D 3X`) or one at a time.

After the last entry, show a confirmation summary:

```
Summary of your decisions:
  To report  : X actions (will go in the email)
  Decide later : Y actions (left as À déclarer)
  Excluded   : Z actions (kept for audit backup)

Confirm and create email draft? [Y/N]
```

On confirmation:
1. Update Exclu entries: `UPDATE france_travail_log SET statut_declaration='Exclu' WHERE id=ANY($1)`
   Pass the array of IDs marked X.
2. Leave D entries unchanged.
3. Draft the email — do NOT mark R entries as `Déclaré` yet (Zack marks them after actually entering into France Travail).

**Positions Reviewed log entry:** After the triage confirmation, if the Positions Reviewed block showed any scan or review activity, offer:
> "Add a Présélection entry to the FT log for this week's review activity? [Y/N]"
> 💬 Revue de [X] offres d'emploi sur la période du [start] au [end] — [Y] retenues, [Z] écartées.

If Y, INSERT into france_travail_log:
```sql
INSERT INTO france_travail_log
(action, date, categorie, priorite, poste_sujet, mode, source, statut_declaration, notes)
VALUES ($1, $2, 'Présélection', 'Optionnel', $3, 'En ligne', 'Auto-Revue', 'À déclarer', $4)
RETURNING id
```
Pass `['Présélection — Revue d\'offres d\'emploi', period_end_date, 'Revue de [X] offres — [Y] retenues, [Z] écartées', commentaire_ft]`.

### Step 2c-iv — Create Gmail draft

Create a Gmail draft to `zberlo12@gmail.com`:

- **Subject:** `France Travail — À déclarer [Mois Année]`
- **Body** (plain text):

```
France Travail — Actions à déclarer
Période : [Mois Année]
Généré le : [today's date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

#1  08/04/2026  —  Candidature
    Entreprise : Schneider Electric
    Poste :      Finance Director
    Site :       Indeed
    🔗 https://fr.indeed.com/viewjob?jk=XXXXXXX
    ▶ Candidature au poste de Finance Director chez Schneider Electric via Indeed.

#2  10/04/2026  —  Entretien
    Entreprise : Raydiall
    Poste :      Finance Director
    Mode :       Téléphonique
    ▶ Entretien téléphonique pour le poste de Finance Director chez Raydiall.

[... all R entries ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OFFRES EXAMINÉES (Présélection)
  Offres examinées : X  (X via alertes + X en revue)
  Retenues : X  |  Écartées : X
  ▶ Revue de X offres d'emploi du [start] au [end] — X retenues, X écartées.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total : X actions à saisir dans France Travail
Une fois saisi, relancer /job-france-travail → Rapport → Marquer comme Déclaré
```

Confirm draft created.

### Step 2c-v — Final offer

After the email draft is created, offer:

```
Options:
  M — Mark reported actions as Déclaré  (after entering them in France Travail)
  A — Add a manual entry
  Q — Quit
```

If **M**: update all R-triage entries:
```sql
UPDATE france_travail_log SET statut_declaration='Déclaré' WHERE id=ANY($1)
```
Pass the array of IDs that were marked R in the triage. Confirm count.

---

## Priorité tier reference

| Catégorie | Priorité | Rationale |
|---|---|---|
| Candidature | Obligatoire | Core France Travail requirement |
| Entretien | Obligatoire | Core France Travail requirement |
| Contact recruteur | Obligatoire | Counts as active outreach |
| Contact réseau | Impactant | Demonstrates active networking |
| Suivi candidature | Impactant | Shows persistence |
| Événement | Impactant | Salon, workshop, coaching |
| France Travail | Impactant | Advisor meetings count |
| Formation | Optionnel | Good to show but lower weight |
| CV · Profil | Optionnel | Background admin |
| Administratif | Optionnel | Keep for completeness |
| Présélection | Optionnel | Role evaluated but screened out pre-application — proves active, reasoned job searching |
| Autre | Optionnel | Catch-all |

---

## France Travail portal fields & comment templates

What France Travail asks for each action type, and the French comment template to pre-fill. Templates use `[placeholders]`. Keep comments under 200 characters.

**This section grows over time** — update it as Zack discovers what the portal actually asks for each category.

### Candidature (job application)
FT portal asks for:
- Nom de l'entreprise
- Intitulé du poste
- Site / canal utilisé (job board name, company website, email, etc.)
- Lien vers l'offre (job posting URL)
- Description courte (comment field)

Required fields in FT Log: entreprise, poste_sujet, mode, job_url (from job_applications — carried forward by sync). notes stores site used (prefix `FT: site=Indeed` etc.)

**Always include the Job URL in the report and email draft** for Candidature entries. If missing, flag it.

Comment template:
> Candidature au poste de [Poste] chez [Entreprise] via [Site]. [Dossier envoyé par email / en ligne.]

### Entretien (interview)
FT portal asks for:
- Nom de l'entreprise
- Intitulé du poste
- Type d'entretien (téléphonique / visioconférence / présentiel)
- Description courte

Required fields: entreprise, poste_sujet, mode

Comment template:
> Entretien [téléphonique / en visioconférence / en présentiel] pour le poste de [Poste] chez [Entreprise].

### Contact recruteur
FT portal asks for:
- Nom du cabinet ou recruteur
- Poste ou domaine concerné
- Mode de contact
- Description courte

Required fields: entreprise (cabinet name), poste_sujet, mode

Comment template:
> Contact avec [Cabinet/Recruteur] au sujet d'opportunités en [domaine/poste]. [Échange par téléphone / email.]

### Contact réseau
FT portal asks for:
- Nom de la personne / entreprise
- Objet de l'échange
- Mode de contact

Required fields: entreprise, poste_sujet (use contact name or topic), mode

Comment template:
> Échange avec [Nom] ([Entreprise]) concernant [les opportunités finance / le marché de l'emploi / un poste spécifique].

### Formation
FT portal asks for:
- Intitulé de la formation
- Organisme
- Durée / modalité

Required fields: poste_sujet (formation title), entreprise (organisme), mode

Comment template:
> Formation : [Intitulé] — [Organisme]. [Durée / En ligne / Présentiel.]

### Événement
FT portal asks for:
- Nom de l'événement
- Lieu / format
- Description

Required fields: poste_sujet (event name), entreprise (organiser if applicable), mode

Comment template:
> Participation à [Nom de l'événement]. [Lieu / En ligne.] Secteur : finance / emploi cadres.

### France Travail (advisor meeting)
Required fields: poste_sujet (object of meeting), mode

Comment template:
> Rendez-vous avec conseiller France Travail. [Objet : point sur la recherche / suivi du dossier.]

---

## Step 2d — Stats mode

```sql
SELECT
  EXTRACT(ISOYEAR FROM date_added)::int AS isoyear,
  EXTRACT(WEEK FROM date_added)::int AS isoweek,
  MIN(date_added) AS week_start,
  COUNT(*) FILTER (WHERE status != 'Dismissed') AS evalues,
  COUNT(*) FILTER (WHERE status IN ('Applied','Docs Ready','Interview','Offer','Rejected')
    AND date_applied IS NOT NULL) AS candidatures
FROM job_applications
GROUP BY isoyear, isoweek
ORDER BY isoyear, isoweek
```

Build a week-by-week table sorted chronologically:

```
═══════════════════════════════════════════════════════════
FRANCE TRAVAIL — Activité hebdomadaire
Depuis : [earliest date] → [today]
═══════════════════════════════════════════════════════════

Semaine              Début       Évalués   Candidatures
──────────────────────────────────────────────────────────
W41 2025             06/10/25        8            3
W42 2025             13/10/25        5            2
...
W15 2026             13/04/26       12            2
──────────────────────────────────────────────────────────
TOTAL                                XX           XX
Moyenne / semaine                   X.X          X.X
Semaines avec ≥ 3 candidatures : X
Semaines actives (≥ 1 candidature) : X / X total
```

After displaying, offer:
```
Options:
  R — Export this as a report (add to the email draft)
  Q — Quit
```

---

## Historical population note (first use)

On first sync, the skill will sweep the **full history** of job_applications and networking_contacts. For actions taken before this system existed, Zack can:
1. Add manual entries via Add mode
2. The skill can also search Gmail for sent application emails (`candidature`, `postuler`, `CV`, `lettre de motivation`) to surface unlogged applications — mention this option at the end of the first sync
