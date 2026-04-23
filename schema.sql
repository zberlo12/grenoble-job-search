-- Job Search Database Schema — PostgreSQL (Supabase)
-- Paste this entire file into Supabase Dashboard → SQL Editor → Run

-- ─── job_applications ────────────────────────────────────────────────────────
CREATE TABLE job_applications (
    id                  SERIAL PRIMARY KEY,
    job_title           TEXT NOT NULL,
    company             TEXT NOT NULL DEFAULT 'Not disclosed',
    source              TEXT,
    location            TEXT,
    salary              TEXT,
    priority            TEXT,
    cv_approach         TEXT,
    status              TEXT NOT NULL DEFAULT 'Needs Info',
    date_added          DATE NOT NULL DEFAULT CURRENT_DATE,
    date_applied        DATE,
    date_response       DATE,
    job_url             TEXT,
    docs_url            TEXT,
    gmail_thread_url    TEXT,
    red_flags           JSONB DEFAULT '[]',
    missing_info        JSONB DEFAULT '[]',
    alert_keyword       TEXT,
    notes               TEXT,
    english             BOOLEAN DEFAULT FALSE,
    application_method  TEXT,
    rejection_reason    TEXT,
    doc_language        TEXT,
    job_description     TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ja_status      ON job_applications(status);
CREATE INDEX idx_ja_date_added  ON job_applications(date_added);
CREATE INDEX idx_ja_company     ON job_applications(company);
CREATE INDEX idx_ja_status_date ON job_applications(status, date_added);

-- ─── review_queue ─────────────────────────────────────────────────────────────
CREATE TABLE review_queue (
    id               SERIAL PRIMARY KEY,
    job_title        TEXT NOT NULL,
    company          TEXT NOT NULL DEFAULT 'Not disclosed',
    source           TEXT,
    location         TEXT,
    salary           TEXT,
    priority         TEXT,
    status           TEXT NOT NULL DEFAULT 'Needs Info',
    date_added       DATE NOT NULL DEFAULT CURRENT_DATE,
    job_url          TEXT,
    gmail_thread_url TEXT,
    red_flags        JSONB DEFAULT '[]',
    missing_info     JSONB DEFAULT '[]',
    alert_keyword    TEXT,
    notes            TEXT,
    english          BOOLEAN DEFAULT FALSE,
    job_description  TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rq_status     ON review_queue(status);
CREATE INDEX idx_rq_date_added ON review_queue(date_added);

-- ─── target_companies ─────────────────────────────────────────────────────────
CREATE TABLE target_companies (
    id           SERIAL PRIMARY KEY,
    company      TEXT NOT NULL,
    tier         TEXT,
    sector       TEXT,
    location     TEXT,
    careers_url  TEXT,
    last_checked DATE,
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tc_tier    ON target_companies(tier);
CREATE INDEX idx_tc_company ON target_companies(company);

-- ─── networking_contacts ──────────────────────────────────────────────────────
CREATE TABLE networking_contacts (
    id             SERIAL PRIMARY KEY,
    name           TEXT NOT NULL,
    company        TEXT,
    role           TEXT,
    email          TEXT,
    linkedin_url   TEXT,
    last_contact   DATE,
    next_followup  DATE,
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nc_next_followup ON networking_contacts(next_followup);
CREATE INDEX idx_nc_company       ON networking_contacts(company);

-- ─── france_travail_log ───────────────────────────────────────────────────────
CREATE TABLE france_travail_log (
    id                    SERIAL PRIMARY KEY,
    action                TEXT NOT NULL,
    date                  DATE NOT NULL DEFAULT CURRENT_DATE,
    categorie             TEXT,
    priorite              TEXT,
    entreprise            TEXT,
    poste_sujet           TEXT,
    mode                  TEXT,
    source                TEXT,
    statut_declaration    TEXT DEFAULT 'À déclarer',
    notes                 TEXT,
    job_application_id    INTEGER REFERENCES job_applications(id) ON DELETE SET NULL,
    contact_id            INTEGER REFERENCES networking_contacts(id) ON DELETE SET NULL,
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ft_date               ON france_travail_log(date);
CREATE INDEX idx_ft_statut_declaration ON france_travail_log(statut_declaration);
CREATE INDEX idx_ft_priorite           ON france_travail_log(priorite);

-- ─── open_todos ───────────────────────────────────────────────────────────────
CREATE TABLE open_todos (
    id         SERIAL PRIMARY KEY,
    task       TEXT NOT NULL,
    category   TEXT,
    priority   TEXT,
    due_date   DATE,
    done       BOOLEAN DEFAULT FALSE,
    notes      TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_todos_done     ON open_todos(done);
CREATE INDEX idx_todos_due_date ON open_todos(due_date);

-- ─── scan_archive ─────────────────────────────────────────────────────────────
CREATE TABLE scan_archive (
    id                SERIAL PRIMARY KEY,
    scan_date         DATE NOT NULL UNIQUE,
    digest_text       TEXT,
    total_found       INTEGER DEFAULT 0,
    potentially_apply INTEGER DEFAULT 0,
    needs_info        INTEGER DEFAULT 0,
    to_assess         INTEGER DEFAULT 0,
    dismissed         INTEGER DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sa_scan_date ON scan_archive(scan_date);
