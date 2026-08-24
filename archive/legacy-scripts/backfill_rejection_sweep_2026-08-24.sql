-- One-time backfill: response-detection sweep had never run against Gmail on a schedule
-- (see OVERVIEW.md "Scheduling — currently manual"), so rejection emails on several of the
-- 42 open ("Applied") job_applications rows sat unprocessed for weeks to months.
--
-- This script is a RECORD of the manual Gmail sweep run interactively on 2026-08-24
-- (each row below was matched against a real rejection email found via Gmail search — see
-- job-status.md Step 2 for the classification logic). It is not meant to be re-run as-is;
-- it is kept for audit trail per the project's archive/ convention (one-off scripts, not
-- deleted). The recurring version of this check now lives in job-email-inbox.md Step 3g,
-- which runs the same canonical logic from job-status.md Step 2 on every inbox scan.

UPDATE job_applications SET status='Rejected', date_response='2026-08-20',
  notes=COALESCE(notes,'') || ' | Backfilled 2026-08-24: rejection email from AK Recrutement 2026-08-20'
  WHERE id=1679; -- Directeur administratif et financier (H/F)

UPDATE job_applications SET status='Rejected', date_response='2026-07-15',
  notes=COALESCE(notes,'') || ' | Backfilled 2026-08-24: rejection email from Lam Research 2026-07-15 (other candidates selected)'
  WHERE id=787; -- Materials Planner 3

UPDATE job_applications SET status='Rejected', date_response='2026-07-02',
  notes=COALESCE(notes,'') || ' | Backfilled 2026-08-24: rejection email from CDG Conseil 2026-07-02'
  WHERE id=820; -- Directeur administratif et financier H/F

UPDATE job_applications SET status='Rejected', date_response='2026-07-02',
  notes=COALESCE(notes,'') || ' | Backfilled 2026-08-24: rejection email from INTERPOL (SuccessFactors) 2026-07-02'
  WHERE id=732; -- Financial Controller

UPDATE job_applications SET status='Rejected', date_response='2026-06-25',
  notes=COALESCE(notes,'') || ' | Backfilled 2026-08-24: rejection email from GE Vernova (Workday) 2026-06-25'
  WHERE id=144; -- Directeur·trice Achats Region Europe et Services Globaux H/F

UPDATE job_applications SET status='Rejected', date_response='2026-05-21',
  notes=COALESCE(notes,'') || ' | Backfilled 2026-08-24: rejection email from Orisha (Teamtailor) 2026-05-21'
  WHERE id=210; -- Responsable Comptable H/F

UPDATE job_applications SET status='Rejected', date_response='2026-07-01',
  notes=COALESCE(notes,'') || ' | Backfilled 2026-08-24: rejection email from Radiall (Beetween) 2026-07-01'
  WHERE id=808; -- Controleur de Gestion R&D et Fonctions Corporate H/F

UPDATE job_applications SET status='Rejected', date_response='2026-07-30',
  notes=COALESCE(notes,'') || ' | Backfilled 2026-08-24: rejection email from AquisIT (HelloWork) 2026-07-30'
  WHERE id=992; -- Responsable Comptable H/F

-- Rows checked but NOT changed (no confirmed rejection found — see chat summary):
--   id=193 LIP Tertiaire        — HelloWork "listing closed" survey only, no confirmed answer
--   id=997 Fonction:Support     — same ambiguous HelloWork survey pattern
--   id=690 Confidentiel (Michael Page) — same ambiguous HelloWork survey pattern
--   id=1848 ALERYS              — acknowledgment only ("étudier avec attention")
--   id=1104 RESEAU TALENTS      — acknowledgment only (Taleez)
--   id=730 JEAN LAIN MOBILITÉS  — acknowledgment only, candidate portal created
--   id=429 CFO LBO (via Selescope), applied 2026-05-23 — no matching thread found;
--     likely a duplicate of the already-Rejected Selescope "CFO LBO F/H" row
--     (date_response 2026-05-03) that dedup missed due to differing company/title strings
--   14 rows past the 60-day auto_expiry_days threshold (config.json lifecycle_rules) with
--     no response found at all — left untouched; auto-expiry is a lifecycle decision, not
--     a rejection, and was out of scope for this sweep. Run /job-status to action those.
