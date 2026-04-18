---
description: Log and report job search actions for France Travail compliance. Auto-syncs from Job Applications and Networking DBs, allows manual entries, and generates audit-ready reports tiered by reporting priority. Trigger with /job-france-travail or when Zack wants to log or review actions for France Travail / Pôle Emploi.
argument-hint: "add | sync | report | blank for interactive menu"
allowed-tools: mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Notion__notion-create-database, mcp__claude_ai_Notion__notion-update-page, mcp__claude_ai_Gmail__search_threads, mcp__claude_ai_Gmail__get_thread, mcp__claude_ai_Gmail__create_draft
---

## Purpose

Maintain an audit-ready log of all job search actions for France Travail compliance. If Zack is audited ("contrôlé"), this log provides dated proof of active job searching, organised by priority tier.

---

## Step 0 — Load user config

Fetch the User Profile & Config page:
```
notion-fetch page_id="3452fc3ca02a811ab75af9805f50ef8b"
```

Extract from Section 7 (Notion IDs):
- `job_applications_db_id`
- `networking_contacts_db_id`
- `france_travail_log_db_id` (may not exist yet — handle below)
- `job_search_root_page_id` (parent for new DB)

**If `france_travail_log_db_id` is missing or blank:**

Create the France Travail Log database as a child of the job search root page with these properties:
- **Action** (title) — auto-generated description
- **Date** (date)
- **Catégorie** (select): Candidature / Entretien / Contact recruteur / Contact réseau / Suivi candidature / Formation / Événement / France Travail / CV · Profil / Administratif / Autre
- **Priorité** (select): Obligatoire / Impactant / Optionnel
- **Entreprise · Organisme** (rich_text)
- **Poste · Sujet** (rich_text)
- **Mode** (select): Email / Téléphone / Visio / Présentiel / En ligne / Courrier
- **Source** (select): Auto-Candidatures / Auto-Réseau / Manuel
- **Statut déclaration** (select): À déclarer / Déclaré / Exclu
- **Notes** (rich_text)

**Statut déclaration values:**
- `À déclarer` — logged but not yet entered into France Travail (default for all new entries)
- `Déclaré` — confirmed entered into France Travail portal/declaration
- `Exclu` — deliberately not reported (e.g. optionnel actions Zack chose to skip), but kept in full history for audit backup

After creating the DB, write its ID back to Section 7 of the User Profile & Config page under the label `france_travail_log_db_id`. Confirm to the user that the database has been initialised.

---

## Step 1 — Menu

If `$ARGUMENTS` is blank, ask the user to choose a mode:

```
France Travail Log — que souhaitez-vous faire ?

1. Synchroniser  — importer depuis Job Applications + Réseau
2. Ajouter       — saisir une action manuelle
3. Rapport       — afficher le journal pour une période
4. Tout          — synchroniser puis afficher le rapport
```

Map responses to modes: `sync`, `add`, `report`, or run sync then report.

If `$ARGUMENTS` is `add`, `sync`, or `report`, go directly to that step.

---

## Step 2a — Sync mode

Pull from both source databases and create missing France Travail Log entries.

### From Job Applications DB

Fetch all rows from `job_applications_db_id`. For each row, apply this mapping:

| Job Application status | FT action to create | Catégorie | Priorité | Date to use |
|---|---|---|---|---|
| Docs Ready | Candidature | Candidature | Obligatoire | Date Applied (or Date Added if blank) |
| Applied | Candidature | Candidature | Obligatoire | Date Applied |
| Interview | Entretien | Entretien | Obligatoire | Date Response |
| Offer | Offre reçue | Entretien | Obligatoire | Date Response |
| Rejected (after Applied) | — | — | — | Skip — application is already logged |

Action title format: `Candidature — [Job Title] @ [Company]` or `Entretien — [Job Title] @ [Company]`

For an Interview row, also create the Candidature entry if Date Applied is set and no candidature entry already exists.

Source: `Auto-Candidatures`

### From Networking Contacts DB

Fetch all rows from `networking_contacts_db_id`. For each row with a Last Contact date set:
- Action title: `Contact réseau — [Name] @ [Company]`
- Catégorie: Contact réseau
- Priorité: Impactant
- Date: Last Contact date
- Source: Auto-Réseau

All new entries created by sync default to **Statut déclaration = À déclarer**.

### Deduplication

Before creating each entry, search the FT Log for an existing entry where:
- Entreprise matches (case-insensitive), AND
- Catégorie matches, AND
- Date is within ±1 day

If found, skip creation. Count skipped entries separately.

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
Source: Manuel.

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

Create the entry and confirm with the Notion page URL.

---

## Step 2c — Report mode

Ask the user three questions:

**Période :**
1. Ce mois-ci ([current month])
2. Mois dernier ([previous month])
3. Depuis le début (all history)
4. Période personnalisée (ask for start and end date)

**Profondeur :**
1. Obligatoire seulement — candidatures, entretiens, contacts recruteur
2. Obligatoire + Impactant — adds réseau, suivis, événements, FT meetings
3. Tout — complete log including formations, CV updates, admin

**Statut déclaration :**
1. À déclarer seulement — show what still needs to be entered into France Travail (default, most useful before a monthly declaration)
2. Déclaré seulement — show what has already been reported
3. Tout sauf Exclu — full history minus deliberately excluded entries
4. Tout — complete log including Exclu entries (audit view)

Fetch matching FT Log entries filtered by Date, Priorité, and Statut déclaration. Sort by Date ascending (chronological — easiest to enter sequentially into France Travail portal).

### Step 2c-i — Check for missing France Travail fields

Before generating the report, check each `À déclarer` entry against the required fields for its category (see **France Travail portal fields** section below). If any required fields are missing, prompt Zack to fill them in before continuing — do this in batch, one entry at a time:

```
Il manque des informations pour 2 entrées :

[1/2] Candidature — Finance Director @ Schneider Electric (2026-04-10)
  Champ manquant : Site utilisé
  → Indeed / LinkedIn / Site entreprise / Email direct / APEC / Autre ?

[2/2] Candidature — FP&A Manager @ STMicroelectronics (2026-04-08)
  Champ manquant : Site utilisé
  → ?
```

Save the answers to the Notes field of each entry (prefix: `FT: `).

### Step 2c-ii — Generate report with French comments

For each entry, generate a **commentaire FT** — a concise French phrase (≤200 characters) ready to paste into the France Travail portal comment field. Use the templates in the **France Travail portal fields** section below.

Output format:

```
═══════════════════════════════════════════════════
FRANCE TRAVAIL — Rapport [Mois Année / Période]
Profondeur : [Obligatoire / Obligatoire + Impactant / Tout]
Statut :     [À déclarer / Déclaré / Tout sauf Exclu / Tout]
═══════════════════════════════════════════════════

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

After displaying the full list, go through each `À déclarer` entry **one at a time** and ask Zack what to do with it. This is the core decision step — he decides right now, delays to next run, or permanently skips.

For each entry show a compact summary and three options:

```
#1  2026-04-08  Candidature — Finance Director @ Schneider Electric
    💬 Candidature au poste de Finance Director chez Schneider Electric via Indeed.

  [R] Reporter cette semaine   → inclure dans l'email
  [D] Décider plus tard        → laisser À déclarer pour la prochaine fois
  [X] Ne pas déclarer          → marquer Exclu (conservé en cas de contrôle)
```

Collect decisions for all entries before writing anything to Notion. After the last entry, show a confirmation summary:

```
Récapitulatif de vos décisions :
  À reporter  : X actions (incluses dans l'email)
  À décider   : Y actions (laissées À déclarer)
  Exclues     : Z actions (conservées pour audit)

Confirmer et créer le brouillon email ? [O/N]
```

On confirmation:
1. Update Notion: set `Exclu` on all entries marked X (leave D entries unchanged)
2. Draft the email (do NOT mark R entries as `Déclaré` yet — Zack marks them Déclaré after actually entering them into France Travail)

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
    ▶ Candidature au poste de Finance Director chez Schneider Electric via Indeed.

#2  10/04/2026  —  Entretien
    Entreprise : Raydiall
    Poste :      Finance Director
    Mode :       Téléphonique
    ▶ Entretien téléphonique pour le poste de Finance Director chez Raydiall.

[... all R entries ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total : X actions à saisir dans France Travail
Une fois saisi, relancer /job-france-travail → Rapport → Marquer comme Déclaré
```

Confirm draft created.

### Step 2c-v — Final offer

After the email draft is created, offer:

```
Options :
  M — Marquer les actions reportées comme Déclaré  (après les avoir saisis dans FT)
  A — Ajouter une action manuelle
  Q — Quitter
```

If **M**: update all entries that were marked R in the triage to `Déclaré` in Notion. Confirm count.

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
- Description courte (comment field)

Required fields in FT Log: Entreprise, Poste/Sujet, Mode, Notes (for site used — prefix `FT: site=Indeed` etc.)

Comment template:
> Candidature au poste de [Poste] chez [Entreprise] via [Site]. [Dossier envoyé par email / en ligne.]

### Entretien (interview)
FT portal asks for:
- Nom de l'entreprise
- Intitulé du poste
- Type d'entretien (téléphonique / visioconférence / présentiel)
- Description courte

Required fields in FT Log: Entreprise, Poste/Sujet, Mode

Comment template:
> Entretien [téléphonique / en visioconférence / en présentiel] pour le poste de [Poste] chez [Entreprise].

### Contact recruteur
FT portal asks for:
- Nom du cabinet ou recruteur
- Poste ou domaine concerné
- Mode de contact
- Description courte

Required fields: Entreprise (cabinet name), Poste/Sujet, Mode

Comment template:
> Contact avec [Cabinet/Recruteur] au sujet d'opportunités en [domaine/poste]. [Échange par téléphone / email.]

### Contact réseau
FT portal asks for:
- Nom de la personne / entreprise
- Objet de l'échange
- Mode de contact

Required fields: Entreprise, Poste/Sujet (use contact name or topic), Mode

Comment template:
> Échange avec [Nom] ([Entreprise]) concernant [les opportunités finance / le marché de l'emploi / un poste spécifique].

### Formation
FT portal asks for:
- Intitulé de la formation
- Organisme
- Durée / modalité

Required fields: Poste/Sujet (formation title), Entreprise (organisme), Mode

Comment template:
> Formation : [Intitulé] — [Organisme]. [Durée / En ligne / Présentiel.]

### Événement
FT portal asks for:
- Nom de l'événement
- Lieu / format
- Description

Required fields: Poste/Sujet (event name), Entreprise (organiser if applicable), Mode

Comment template:
> Participation à [Nom de l'événement]. [Lieu / En ligne.] Secteur : finance / emploi cadres.

### France Travail (advisor meeting)
Required fields: Poste/Sujet (object of meeting), Mode

Comment template:
> Rendez-vous avec conseiller France Travail. [Objet : point sur la recherche / suivi du dossier.]

---

## Historical population note (first use)

On first sync, the skill will sweep the **full history** of Job Applications (all dates) and Networking Contacts. This will create entries going back to the start of the job search. For actions taken before this system existed (e.g. from Claude Desktop sessions), Zack can:
1. Ask Claude Desktop to produce a list of job search actions with dates
2. Paste the list and the skill will parse it and create entries in batch (use Add mode, one by one, or describe the batch)
3. The skill can also search Gmail for sent application emails (`candidature`, `postuler`, `CV`, `lettre de motivation`) to surface unlogged applications — mention this option at the end of the first sync
