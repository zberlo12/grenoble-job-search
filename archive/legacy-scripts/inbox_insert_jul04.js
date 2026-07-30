const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const client = new Client({ connectionString: 'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres' });

const USER_PROFILE = 'zberlo';
const PARSE_DATE = '2026-07-04';
const THREAD_URL = (id) => `https://mail.google.com/mail/u/0/#all/${id}`;

// listings to insert as 'pending' (deduped by job_url within this batch + against DB)
const listings = [
  // --- Indeed 14-listing digest (thread 19f2ebd74d1427a0, alert_keyword: finance director) ---
  { thread: '19f2ebd74d1427a0', source: 'Indeed', alert_keyword: 'finance director', job_title: 'Responsable Finance H/F', company: 'CRISTAL HABITAT', location: 'Chambéry (73)', salary: 'De 52 000 € à 58 000 € par an', job_url: 'https://fr.indeed.com/viewjob?jk=m91d94567b88be0', contract_type: null, english: false, raw_snippet: 'Responsable Finance H/F - CRISTAL HABITAT - Chambéry (73) - De 52 000 € à 58 000 € par an' },
  { thread: '19f2ebd74d1427a0', source: 'Indeed', alert_keyword: 'finance director', job_title: 'Responsable du service financier (f/h)', company: 'Université Grenoble Alpes', location: 'Gières (38)', salary: 'À partir de 1 944 € par mois', job_url: 'https://fr.indeed.com/viewjob?jk=wb0fcec8de0bf0e', contract_type: null, english: false, raw_snippet: 'Responsable du service financier (f/h) - Université Grenoble Alpes - Gières (38)' },
  { thread: '19f2ebd74d1427a0', source: 'Indeed', alert_keyword: 'finance director', job_title: "Directeur de magasin St Martin d'Heres (H/F)", company: 'Wise RH', location: "Saint-Martin-d'Hères (38)", salary: '40 000 € par an', job_url: 'https://fr.indeed.com/viewjob?jk=9953ae16d83ac4', contract_type: null, english: false, raw_snippet: "Directeur de magasin St Martin d'Heres (H/F) - Wise RH" },
  { thread: '19f2ebd74d1427a0', source: 'Indeed', alert_keyword: 'finance director', job_title: "Directeur d'EHPAD F/H", company: 'Les Bruyères Association', location: 'Sassenage (38)', salary: 'De 55 000 € à 60 000 € par an', job_url: 'Not available', contract_type: null, english: false, raw_snippet: "Directeur d'EHPAD F/H - Les Bruyères Association" },
  { thread: '19f2ebd74d1427a0', source: 'Indeed', alert_keyword: 'finance director', job_title: 'DIRECTEUR DE MAGASIN F/H', company: 'Centrakor', location: "Saint-Martin-d'Hères (38)", salary: null, job_url: 'Not available', contract_type: null, english: false, raw_snippet: 'DIRECTEUR DE MAGASIN F/H - Centrakor' },
  { thread: '19f2ebd74d1427a0', source: 'Indeed', alert_keyword: 'finance director', job_title: 'Directeur Exécution et Qualité Budgétaire (f/h)', company: 'Université Grenoble Alpes', location: 'Gières (38)', salary: 'À partir de 1 944 € par mois', job_url: 'https://fr.indeed.com/viewjob?jk=896a3ed43ef09b', contract_type: null, english: false, raw_snippet: 'Directeur Exécution et Qualité Budgétaire (f/h) - Université Grenoble Alpes' },
  { thread: '19f2ebd74d1427a0', source: 'Indeed', alert_keyword: 'finance director', job_title: 'Directeur adjoint de magasin H/F', company: 'JM INVEST', location: 'Grenoble (38)', salary: 'De 2 933,00 € à 3 550,01 € par mois', job_url: 'https://fr.indeed.com/viewjob?jk=F8554faa6f4c515', contract_type: null, english: false, raw_snippet: 'Directeur adjoint de magasin H/F - JM INVEST' },
  { thread: '19f2ebd74d1427a0', source: 'Indeed', alert_keyword: 'finance director', job_title: 'Directeur/ Directrice de centre', company: 'NORAUTO', location: 'Chambéry (73)', salary: null, job_url: 'https://fr.indeed.com/viewjob?jk=n9e051cfd52b7f0', contract_type: null, english: false, raw_snippet: 'Directeur/ Directrice de centre - NORAUTO' },
  { thread: '19f2ebd74d1427a0', source: 'Indeed', alert_keyword: 'finance director', job_title: "Directeur d'agence H/F", company: 'VITALIS MEDICAL', location: 'Grenoble (38)', salary: 'De 50 000 € à 100 000 € par an', job_url: 'Not available', contract_type: null, english: false, raw_snippet: "Directeur d'agence H/F - VITALIS MEDICAL - Grenoble" },
  { thread: '19f2ebd74d1427a0', source: 'Indeed', alert_keyword: 'finance director', job_title: 'Directeur Expertise comptable', company: 'Fiducial', location: "Saint-Martin-d'Hères (38)", salary: null, job_url: 'Not available', contract_type: null, english: false, raw_snippet: 'Directeur Expertise comptable - Saint-Martin (971) H/F - Fiducial' },
  { thread: '19f2ebd74d1427a0', source: 'Indeed', alert_keyword: 'finance director', job_title: 'Responsable pôle Accueil et Administratif', company: 'MJC des Eaux Claires', location: 'Grenoble (38)', salary: '2 184 € par mois', job_url: 'https://fr.indeed.com/viewjob?jk=Pf37715725e9da3', contract_type: null, english: false, raw_snippet: 'Responsable pôle Accueil et Administratif - MJC des Eaux Claires' },
  { thread: '19f2ebd74d1427a0', source: 'Indeed', alert_keyword: 'finance director', job_title: 'Directeur junior de village vacances H/F', company: 'CEVEO', location: 'Allevard (38)', salary: '2 900 € par mois', job_url: 'https://fr.indeed.com/viewjob?jk=cecf9d6f4c0dcf', contract_type: null, english: false, raw_snippet: 'Directeur junior de village vacances H/F - CEVEO' },
  { thread: '19f2ebd74d1427a0', source: 'Indeed', alert_keyword: 'finance director', job_title: "Directeur d'agence H/F", company: 'VITALIS MEDICAL', location: 'Voiron (38)', salary: 'De 50 000 € à 100 000 € par an', job_url: 'Not available', contract_type: null, english: false, raw_snippet: "Directeur d'agence H/F - VITALIS MEDICAL - Voiron" },
  { thread: '19f2ebd74d1427a0', source: 'Indeed', alert_keyword: 'finance director', job_title: "Directeur d'agence H/F", company: 'VITALIS MEDICAL', location: 'Tullins (38)', salary: 'De 50 000 € à 100 000 € par an', job_url: 'Not available', contract_type: null, english: false, raw_snippet: "Directeur d'agence H/F - VITALIS MEDICAL - Tullins" },

  // --- Indeed single-alert threads ---
  { thread: '19f2e72428a9bebe', source: 'Indeed', alert_keyword: 'Pilote Financier', job_title: 'Cadre de gestion de pôles - h/f', company: 'Centre Hospitalier Universitaire de Grenoble', location: 'La Tronche (38)', salary: null, job_url: 'https://fr.indeed.com/viewjob?jk=ce3cc44c32a04a', contract_type: null, english: false, raw_snippet: "Centre Hospitalier Universitaire de Grenoble vous propose une offre d'emploi ! Cadre de gestion de pôles - h/f" },
  { thread: '19f2ac6eef9b493a', source: 'Indeed', alert_keyword: 'Contrôleur de Gestion', job_title: 'Responsable du service financier (f/h)', company: 'Université Grenoble Alpes', location: 'Gières (38)', salary: 'À partir de 1 944 € par mois', job_url: 'https://fr.indeed.com/viewjob?jk=wb0fcec8de0bf0e', contract_type: null, english: false, raw_snippet: "Université Grenoble Alpes vous propose une offre d'emploi ! Responsable du service financier (f/h)" },

  // --- LinkedIn ---
  { thread: '19f2f8be7f7aa0d7', source: 'LinkedIn', alert_keyword: 'Responsable Administratif Financier', job_title: 'Contrôleur de Gestion - R&D et Fonctions Corporate (H/F)', company: 'Radiall', location: 'Voreppe', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4433702131', contract_type: null, english: false, raw_snippet: 'Contrôleur de Gestion - R&D et Fonctions Corporate (H/F) - Radiall - Voreppe' },
  { thread: '19f2f8be7f7aa0d7', source: 'LinkedIn', alert_keyword: 'Responsable Administratif Financier', job_title: 'Cadre de gestion de pôles - H/F', company: 'CHU Grenoble Alpes', location: 'Corenc', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4433171728', contract_type: null, english: false, raw_snippet: 'Cadre de gestion de pôles - H/F - CHU Grenoble Alpes - Corenc' },
  { thread: '19f2f8be7f7aa0d7', source: 'LinkedIn', alert_keyword: 'Responsable Administratif Financier', job_title: 'Responsable du service Cotisations Non Salariés - Gestion des entreprises', company: 'MSA Alpes du Nord', location: 'Échirolles', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4436753922', contract_type: null, english: false, raw_snippet: 'Responsable du service Cotisations Non Salariés - MSA Alpes du Nord - Échirolles' },
  { thread: '19f2f1e05ac6a71c', source: 'LinkedIn', alert_keyword: 'Responsable Administratif et Financier', job_title: 'Contrôleur de Gestion - R&D et Fonctions Corporate (H/F)', company: 'Radiall', location: 'Voreppe', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4433702131', contract_type: null, english: false, raw_snippet: 'dup - digest' },
  { thread: '19f2f1e05ac6a71c', source: 'LinkedIn', alert_keyword: 'Responsable Administratif et Financier', job_title: 'Cadre de gestion de pôles - H/F', company: 'CHU Grenoble Alpes', location: 'Corenc', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4433171728', contract_type: null, english: false, raw_snippet: 'dup - digest' },
  { thread: '19f2f1e05ac6a71c', source: 'LinkedIn', alert_keyword: 'Responsable Administratif et Financier', job_title: 'Responsable du service Cotisations Non Salariés - Gestion des entreprises', company: 'MSA Alpes du Nord', location: 'Échirolles', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4436753922', contract_type: null, english: false, raw_snippet: 'dup - digest' },
  { thread: '19f2f1e05ac6a71c', source: 'LinkedIn', alert_keyword: 'Responsable Administratif et Financier', job_title: '[CDI] Gestionnaire comptable administratif anglophone (H/F)', company: 'BioLogic', location: 'Seyssinet-Pariset', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4435238993', contract_type: 'CDI', english: false, raw_snippet: '[CDI] Gestionnaire comptable administratif anglophone (H/F) - BioLogic' },
  { thread: '19f2eb0276d3f965', source: 'LinkedIn', alert_keyword: 'Contrôleur de Gestion', job_title: 'Alternant contrôleur de gestion', company: 'Hermès', location: 'Les Abrets en Dauphiné', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4367813663', contract_type: null, english: false, raw_snippet: 'Alternant contrôleur de gestion - Hermès' },
  { thread: '19f2e425784ee27f', source: 'LinkedIn', alert_keyword: 'Responsable Supply Chain', job_title: 'Manager Inventory & Planning (d/f/m)', company: 'Roche', location: 'Meylan', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4436765256', contract_type: null, english: false, raw_snippet: 'Manager Inventory & Planning (d/f/m) - Roche' },
  { thread: '19f2dd48d957f8ec', source: 'LinkedIn', alert_keyword: 'Responsable Supply Chain', job_title: 'Manager Inventory & Planning (d/f/m)', company: 'Roche', location: 'Meylan', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4436765256', contract_type: null, english: false, raw_snippet: 'dup - direct alert' },
  { thread: '19f2d66c9f2f0f41', source: 'LinkedIn', alert_keyword: 'Credit Manager', job_title: 'Credit Manager (Fraud)', company: 'Revolut', location: 'France', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4426650462', contract_type: null, english: true, raw_snippet: 'Credit Manager (Fraud) - Revolut' },
  { thread: '19f2cf8be73e8f7a', source: 'LinkedIn', alert_keyword: 'Responsable Achats', job_title: 'Acheteur Senior – Commande Publique (38) - H/F', company: 'Ortec Group', location: 'Grenoble', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4427947573', contract_type: null, english: false, raw_snippet: 'Acheteur Senior – Commande Publique (38) - H/F - Ortec Group' },
  { thread: '19f2c1d5b8aa1d04', source: 'LinkedIn', alert_keyword: 'Financial Controller', job_title: 'Contrôleur de Gestion - R&D et Fonctions Corporate (H/F)', company: 'Radiall', location: 'Voreppe', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4433702131', contract_type: null, english: false, raw_snippet: 'dup - digest' },
  { thread: '19f2c1d5b8aa1d04', source: 'LinkedIn', alert_keyword: 'Financial Controller', job_title: 'Cadre de gestion de pôles - H/F', company: 'CHU Grenoble Alpes', location: 'Corenc', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4433171728', contract_type: null, english: false, raw_snippet: 'dup - digest' },
  { thread: '19f2c1d5b8aa1d04', source: 'LinkedIn', alert_keyword: 'Financial Controller', job_title: 'Responsable du service Cotisations Non Salariés - Gestion des entreprises', company: 'MSA Alpes du Nord', location: 'Échirolles', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4436753922', contract_type: null, english: false, raw_snippet: 'dup - digest' },
  { thread: '19f2c1d5b8aa1d04', source: 'LinkedIn', alert_keyword: 'Contrôleur de Gestion', job_title: 'Contrôleur de Gestion - R&D et Fonctions Corporate (H/F)', company: 'Radiall', location: 'Voreppe', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4433702131', contract_type: null, english: false, raw_snippet: 'dup - digest msg2' },
  { thread: '19f2c1d5b8aa1d04', source: 'LinkedIn', alert_keyword: 'Contrôleur de Gestion', job_title: 'Cadre de gestion de pôles - H/F', company: 'CHU Grenoble Alpes', location: 'Corenc', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4433171728', contract_type: null, english: false, raw_snippet: 'dup - digest msg2' },
  { thread: '19f2c1d5b8aa1d04', source: 'LinkedIn', alert_keyword: 'Contrôleur de Gestion', job_title: 'Chargé de mission pilotage de la collecte (F/H)', company: 'Grenoble-Alpes Métropole', location: 'Grenoble', salary: null, job_url: 'https://www.linkedin.com/jobs/view/4436722295', contract_type: null, english: false, raw_snippet: 'Chargé de mission pilotage de la collecte (F/H) - Grenoble-Alpes Métropole' },
];

// known HTML-only source rows (Cadremploi x3, HelloWork x1) -> puppeteer_pending
const puppeteerPending = [
  { thread: '19f2cab83f3fa34c', source: 'Cadremploi', subject: 'Et si vous modifiez vos critères de recherche ?' },
  { thread: '19f2c805bc4ed475', source: 'Cadremploi', subject: '2 offres à ne rater sous aucun prétexte !' },
  { thread: '19f2d8766abdcc00', source: 'Cadremploi', subject: 'Votre profil intéresse ces entreprises !' },
  { thread: '19f2c4aa2d215ba0', source: 'Direct', subject: "Zachary, Radiall recrute un Contrôleur de Gestion - R&D et Fonctions Corporate H/F" },
];

// APEC manual_check
const apec = { thread: '19f2bf9dd0d95d20', subject: '4 offres Apec du 04/07/2026', snippet: "Découvrez votre sélection d'offres. Si vous avez des difficultés pour visualiser ce message, cliquez ici. Voici une sélection d'offres d'emploi 2 offres correspondent à votre recherche :" };

async function main() {
  await client.connect();
  let inserted = 0, urlDedup = 0, errors = [];

  for (const l of listings) {
    try {
      if (l.job_url !== 'Not available') {
        const dupCheck = await client.query(
          `SELECT id FROM (
             SELECT id FROM listing_inbox WHERE job_url=$1 AND parse_date >= CURRENT_DATE - 7 AND user_profile=$2
             UNION ALL
             SELECT id FROM job_applications WHERE job_url=$1 AND user_profile=$2
           ) t LIMIT 1`,
          [l.job_url, USER_PROFILE]
        );
        if (dupCheck.rows.length > 0) {
          urlDedup++;
          continue;
        }
      }
      const rawBody = (l.raw_snippet || '').slice(0, 500);
      await client.query(
        `INSERT INTO listing_inbox
         (parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
          job_title, company, location, salary, job_url, contract_type,
          parse_status, parse_notes, english, raw_snippet, raw_body, user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [PARSE_DATE, l.thread, THREAD_URL(l.thread), l.source, l.alert_keyword,
         l.job_title, l.company, l.location, l.salary, l.job_url, l.contract_type,
         'pending', null, l.english, l.raw_snippet.slice(0,200), rawBody, USER_PROFILE]
      );
      inserted++;
    } catch (e) {
      errors.push({ title: l.job_title, thread: l.thread, error: e.message });
    }
  }

  let puppeteerCount = 0;
  for (const p of puppeteerPending) {
    try {
      await client.query(
        `INSERT INTO listing_inbox
         (parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
          job_title, company, location, salary, job_url, contract_type,
          parse_status, parse_notes, english, raw_snippet, raw_body, user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [PARSE_DATE, p.thread, THREAD_URL(p.thread), p.source, null,
         null, null, null, null, 'Not available', null,
         'puppeteer_pending', 'Known HTML-only source — queued for Puppeteer extraction', false,
         p.subject.slice(0,200), p.subject.slice(0,500), USER_PROFILE]
      );
      puppeteerCount++;
    } catch (e) {
      errors.push({ title: '[puppeteer_pending] ' + p.subject, thread: p.thread, error: e.message });
    }
  }

  let apecCount = 0;
  try {
    await client.query(
      `INSERT INTO listing_inbox
       (parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
        job_title, company, location, salary, job_url, contract_type,
        parse_status, parse_notes, english, raw_snippet, raw_body, user_profile)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [PARSE_DATE, apec.thread, THREAD_URL(apec.thread), 'APEC', 'APEC',
       null, null, null, null, 'Not available', null,
       'manual_check', 'APEC: 4 offres — APEC — HTML-only — check apec.fr manually', false,
       apec.snippet.slice(0,200), (apec.subject + ' | ' + apec.snippet).slice(0,500), USER_PROFILE]
    );
    apecCount = 1;
  } catch (e) {
    errors.push({ title: '[APEC]', thread: apec.thread, error: e.message });
  }

  console.log(JSON.stringify({
    threadsTotal: 16,
    inserted_pending: inserted,
    url_dedup: urlDedup,
    puppeteer_pending: puppeteerCount,
    manual_check_apec: apecCount,
    errors
  }, null, 2));

  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
