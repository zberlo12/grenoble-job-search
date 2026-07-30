const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const client = new Client({ connectionString: 'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres' });
const USER_PROFILE = 'zberlo';

// Needs Info + Priority C rows -> review_queue
const reviewQueue = [
  { id: 1233, job_title: "Directeur(trice) Administratif(ve) et Gestion F/H", company: "Groupe Samse", source: "Indeed", location: "Échirolles (38)", salary: "60 000 € par an", priority: 'B', status: 'Needs Info', job_url: "https://fr.indeed.com/viewjob?jk=23921f3f114c09", alert_keyword: "finance director", missing_info: ["Hybrid policy","Scope"], notes: "QUEUED: same role also posted under CHRISTAUD/SIMC entity names — consolidated", english: false },
  { id: 1298, job_title: "Responsable Finance H/F", company: "CRISTAL HABITAT", source: "Indeed", location: "Chambéry (73)", salary: "De 52 000 € à 58 000 € par an", priority: 'B', status: 'Needs Info', job_url: "https://fr.indeed.com/viewjob?jk=m91d94567b88be0", alert_keyword: "finance director", missing_info: ["Hybrid policy","Scope"], notes: "QUEUED:", english: false },
  { id: 1247, job_title: "Responsable administratif, financier et RH H/F (H/F)", company: "France Travail", source: "LinkedIn", location: "Grenoble", salary: null, priority: 'B', status: 'Needs Info', job_url: "https://www.linkedin.com/jobs/view/4431223932", alert_keyword: "Directeur Financier", missing_info: ["Salary","Hybrid policy","Scope"], notes: "QUEUED:", english: false },
  { id: 1259, job_title: "Directeur Administratif et financier", company: "Fed Finance", source: "LinkedIn", location: "Eybens", salary: "€70K-€100K/year", priority: 'B', status: 'Needs Info', job_url: "https://www.linkedin.com/jobs/view/4435535047/", alert_keyword: "LinkedIn", missing_info: ["Company name","Hybrid policy","Scope"], notes: "QUEUED: posted via recruiter (Fed Finance) — real employer not disclosed", english: false },
  { id: 1261, job_title: "Responsable comptable H/F", company: "Team.is", source: "LinkedIn", location: "Voiron", salary: null, priority: 'B', status: 'Needs Info', job_url: "https://www.linkedin.com/jobs/view/4434613770/", alert_keyword: "LinkedIn", missing_info: ["Salary","Hybrid policy","Scope"], notes: "QUEUED:", english: false },
  { id: 1262, job_title: "Manager comptable H/F", company: "Groupe MG", source: "LinkedIn", location: "Grenoble", salary: null, priority: 'B', status: 'Needs Info', job_url: "https://www.linkedin.com/jobs/view/4432356667/", alert_keyword: "LinkedIn", missing_info: ["Salary","Hybrid policy","Scope"], notes: "QUEUED: also seen via HelloWork — consolidated", english: false },
  { id: 1263, job_title: "Chef(fe) de mission comptable - H/F", company: "New-slot Recrutement", source: "LinkedIn", location: "Seyssinet-Pariset", salary: null, priority: 'B', status: 'Needs Info', job_url: "https://www.linkedin.com/jobs/view/4434606543/", alert_keyword: "LinkedIn", missing_info: ["Salary","Hybrid policy","Scope","Company name"], notes: "QUEUED: posted via recruiter", english: false },
  { id: 1264, job_title: "Responsable comptable H/F", company: "Coopérative U", source: "LinkedIn", location: "Biol", salary: null, priority: 'B', status: 'Needs Info', job_url: "https://www.linkedin.com/jobs/view/4435838402/", alert_keyword: "LinkedIn", missing_info: ["Salary","Hybrid policy","Scope"], notes: "QUEUED: Biol location zone unconfirmed — verify commute", english: false },
  { id: 1242, job_title: "Planificateur/Planificatrice", company: "Radiall", source: "LinkedIn", location: "Voreppe", salary: null, priority: 'B', status: 'Needs Info', job_url: "Not available", alert_keyword: "Responsable Supply Chain", missing_info: ["Salary","Hybrid policy","Scope"], notes: "OPERATIONAL ROLE — review for fit", english: false },
  { id: 1266, job_title: "Chef de Projet Logistique H/F", company: "Rhenus Logistics", source: "LinkedIn", location: "Vaulx-Milieu", salary: null, priority: 'B', status: 'Needs Info', job_url: "https://www.linkedin.com/jobs/view/4435819638/", alert_keyword: "LinkedIn", missing_info: ["Salary","Hybrid policy","Scope"], notes: "OPERATIONAL ROLE — review for fit", english: false },
  { id: 1267, job_title: "DIRECTEUR DE SITE LOGISTIQUE H/F - CHATEAUBOURG (35)", company: "Sonepar France", source: "LinkedIn", location: "Rives", salary: null, priority: 'B', status: 'Needs Info', job_url: "https://www.linkedin.com/jobs/view/4432321287/", alert_keyword: "LinkedIn", missing_info: ["Salary","Hybrid policy","Scope"], notes: "OPERATIONAL ROLE — review for fit", english: false },
  { id: 1253, job_title: "Raf H/F", company: "Fonction:Support", source: "Direct", location: null, salary: null, priority: 'B', status: 'Needs Info', job_url: "Not available", alert_keyword: "HelloWork", missing_info: ["Company name","Salary","Hybrid policy","Scope"], notes: "QUEUED: HelloWork subject-parse — company name looks like an extraction artifact, verify manually", english: false },
  { id: 1310, job_title: "Cadre de gestion de pôles - h/f", company: "Centre Hospitalier Universitaire de Grenoble", source: "Indeed", location: "La Tronche (38)", salary: null, priority: 'B', status: 'Needs Info', job_url: "https://fr.indeed.com/viewjob?jk=ce3cc44c32a04a", alert_keyword: "Pilote Financier", missing_info: ["Salary","Hybrid policy","Scope"], notes: "QUEUED: hospital administrative role — verify finance/budget scope. Also seen via LinkedIn (CHU Grenoble Alpes, Corenc) — consolidated", english: false },
  { id: 1311, job_title: "Contrôleur de Gestion - R&D et Fonctions Corporate (H/F)", company: "Radiall", source: "LinkedIn", location: "Voreppe", salary: null, priority: 'B', status: 'Needs Info', job_url: "https://www.linkedin.com/jobs/view/4433702131", alert_keyword: "Responsable Administratif Financier", missing_info: ["Salary","Hybrid policy","Scope"], notes: "QUEUED:", english: false },
  { id: 1313, job_title: "Responsable du service Cotisations Non Salariés - Gestion des entreprises", company: "MSA Alpes du Nord", source: "LinkedIn", location: "Échirolles", salary: null, priority: 'B', status: 'Needs Info', job_url: "https://www.linkedin.com/jobs/view/4436753922", alert_keyword: "Responsable Administratif Financier", missing_info: ["Salary","Hybrid policy","Scope"], notes: "QUEUED:", english: false },
  { id: 1314, job_title: "[CDI] Gestionnaire comptable administratif anglophone (H/F)", company: "BioLogic", source: "LinkedIn", location: "Seyssinet-Pariset", salary: null, priority: 'B', status: 'Needs Info', job_url: "https://www.linkedin.com/jobs/view/4435238993", alert_keyword: "Responsable Administratif et Financier", missing_info: ["Salary","Hybrid policy","Scope"], notes: "QUEUED: verify seniority — title reads more junior/administrative than Director-level", english: false },
  { id: 1317, job_title: "Credit Manager (Fraud)", company: "Revolut", source: "LinkedIn", location: "France", salary: null, priority: 'B', status: 'Needs Info', job_url: "https://www.linkedin.com/jobs/view/4426650462", alert_keyword: "Credit Manager", missing_info: ["Salary","Hybrid policy","Scope"], notes: "QUEUED:", english: true },
  { id: 1318, job_title: "Acheteur Senior – Commande Publique (38) - H/F", company: "Ortec Group", source: "LinkedIn", location: "Grenoble", salary: null, priority: 'B', status: 'Needs Info', job_url: "https://www.linkedin.com/jobs/view/4427947573", alert_keyword: "Responsable Achats", missing_info: ["Salary","Hybrid policy","Scope"], notes: "QUEUED:", english: false },
  { id: 1319, job_title: "Chargé de mission pilotage de la collecte (F/H)", company: "Grenoble-Alpes Métropole", source: "LinkedIn", location: "Grenoble", salary: null, priority: 'B', status: 'Needs Info', job_url: "https://www.linkedin.com/jobs/view/4436722295", alert_keyword: "Contrôleur de Gestion", missing_info: ["Salary","Hybrid policy","Scope"], notes: "OPERATIONAL ROLE — review for fit", english: false },
  { id: 1257, job_title: "Contrôleur de gestion H/F", company: "Grafton", source: "Indeed", location: "Sassenage (38)", salary: "De 42 000 € à 48 000 € par an", priority: 'C', status: 'To Assess', job_url: "https://fr.indeed.com/pagead/clk/dl?mo=r&ad=NYlbfkN0BgixFXyPrcENGFVu5q-RHavWQqs4xEGD5YVI2vA7a5TmAYwYadNg-45didr", alert_keyword: "Contrôleur de Gestion", missing_info: [], red_flags: ["Low salary"], notes: "Below preferred salary band (42-48K vs 55K target)", english: false },
];

// Dismissed -> job_applications
const dismissed = [
  { id: 1234, job_title: "Directeur Pilotage Budgétaire et Financier (f/h)", company: "Université Grenoble Alpes", source: "Indeed", location: "Gières (38)", salary: "À partir de 1 944 € par mois", job_url: "https://fr.indeed.com/rc/clk/dl?jk=bc34ea5caa87fe", alert_keyword: "finance director", red_flags: ["Low salary","Fixed-term"], notes: "Auto-dismissed: salary ~23K/year (below €40K), CDD", english: false },
  { id: 1299, job_title: "Responsable du service financier (f/h)", company: "Université Grenoble Alpes", source: "Indeed", location: "Gières (38)", salary: "À partir de 1 944 € par mois", job_url: "https://fr.indeed.com/viewjob?jk=wb0fcec8de0bf0e", alert_keyword: "finance director", red_flags: ["Low salary"], notes: "Auto-dismissed: salary ~23K/year (below €40K)", english: false },
  { id: 1280, job_title: "Directeur Exécution et Qualité Budgétaire (f/h)", company: "Université Grenoble Alpes", source: "Indeed", location: "Gières (38)", salary: "À partir de 1 944 € par mois", job_url: "https://fr.indeed.com/rc/clk/dl?jk=896a3ed43ef09b", alert_keyword: "finance director", red_flags: ["Low salary","Fixed-term"], notes: "Auto-dismissed: salary ~23K/year (below €40K), CDD", english: false },
  { id: 1238, job_title: "Directeur adjoint H/F", company: "Les Etoiles d'Hestia", source: "Indeed", location: "Montmélian (73)", salary: null, job_url: "https://fr.indeed.com/rc/clk/dl?jk=05a6605b82ecdf", alert_keyword: "finance director", red_flags: ["Off-topic"], notes: "Auto-dismissed: unrelated role (care home management)", english: false },
  { id: 1240, job_title: "Comptable unique (H/F)", company: "Talents Finance", source: "LinkedIn", location: null, salary: "up to €36K/year", job_url: "Not available", alert_keyword: "LinkedIn", red_flags: ["Low salary","Junior scope"], notes: "Auto-dismissed: salary below €40K, junior scope", english: false },
  { id: 1246, job_title: "Contrôleur de Gestion Junior H/F", company: "Neptune RH Grenoble", source: "Direct", location: null, salary: null, job_url: "Not available", alert_keyword: "HelloWork", red_flags: ["Junior scope"], notes: "Auto-dismissed: explicitly junior/entry-level", english: false },
  { id: 1302, job_title: "Directeur adjoint de magasin H/F", company: "JM INVEST", source: "Indeed", location: "Grenoble (38)", salary: "De 2 933,00 € à 3 550,01 € par mois", job_url: "https://fr.indeed.com/viewjob?jk=F8554faa6f4c515", alert_keyword: "finance director", red_flags: ["Off-topic"], notes: "Auto-dismissed: unrelated role (retail store management)", english: false },
  { id: 1303, job_title: "Directeur/ Directrice de centre", company: "NORAUTO", source: "Indeed", location: "Chambéry (73)", salary: null, job_url: "https://fr.indeed.com/viewjob?jk=n9e051cfd52b7f0", alert_keyword: "finance director", red_flags: ["Off-topic"], notes: "Auto-dismissed: unrelated role (auto-service center management)", english: false },
  { id: 1282, job_title: "INTERMARCHE - DIRECTEUR DE MAGASIN (H/F)", company: "Intermarché", source: "Indeed", location: "Saint-Siméon-de-Bressieux (38)", salary: null, job_url: "https://fr.indeed.com/rc/clk/dl?jk=y797d4acf7c7cd3", alert_keyword: "finance director", red_flags: ["Off-topic"], notes: "Auto-dismissed: unrelated role (retail store management)", english: false },
  { id: 1283, job_title: "Directeur / Directrice de crèche EJE en CDI — H/F", company: "Zanaka Solutions RH", source: "Indeed", location: "Eybens (38)", salary: "À partir de 2 500 € par mois", job_url: "https://fr.indeed.com/rc/clk/dl?jk=27c92dec57ca86", alert_keyword: "finance director", red_flags: ["Off-topic","Low salary"], notes: "Auto-dismissed: unrelated role (childcare center), below €40K", english: false },
  { id: 1306, job_title: "Responsable pôle Accueil et Administratif", company: "MJC des Eaux Claires", source: "Indeed", location: "Grenoble (38)", salary: "2 184 € par mois", job_url: "https://fr.indeed.com/viewjob?jk=Pf37715725e9da3", alert_keyword: "finance director", red_flags: ["Low salary","Off-topic"], notes: "Auto-dismissed: salary ~26K/year (below €40K), reception/admin scope not finance-director-level", english: false },
  { id: 1287, job_title: "Directeur adjoint H/F - CDI", company: "Buffalo Grill", source: "Indeed", location: "Saint-Égrève (38)", salary: "2 433,60 € par mois", job_url: "https://fr.indeed.com/rc/clk/dl?jk=08dcc7810260d87", alert_keyword: "finance director", red_flags: ["Off-topic","Low salary"], notes: "Auto-dismissed: unrelated role (restaurant management), below €40K", english: false },
  { id: 1307, job_title: "Directeur junior de village vacances H/F", company: "CEVEO", source: "Indeed", location: "Allevard (38)", salary: "2 900 € par mois", job_url: "https://fr.indeed.com/viewjob?jk=cecf9d6f4c0dcf", alert_keyword: "finance director", red_flags: ["Junior scope","Low salary","Off-topic"], notes: "Auto-dismissed: explicitly junior, unrelated role, below €40K", english: false },
  { id: 1292, job_title: "Directeur de site TOYOTA - H/F - Echirolles", company: "Jean Lain Mobilites", source: "Indeed", location: "Echirolles (38)", salary: "De 70 000 EUR a 100 000 EUR par an", job_url: "https://fr.indeed.com/rc/clk/dl?jk=7c14350adcb1be", alert_keyword: "Pilote Financier", red_flags: ["Off-topic"], notes: "Auto-dismissed: unrelated role (auto dealership site management)", english: false },
  { id: 1293, job_title: "Benevolat - J'apporte mon aide benevole en tant que tresorier d'une association", company: "JeVeuxAider.gouv.fr", source: "LinkedIn", location: "France", salary: null, job_url: "https://www.linkedin.com/comm/jobs/view/4434301617/", alert_keyword: "Credit Manager OR Responsable Tresorerie", red_flags: ["Off-topic"], notes: "Auto-dismissed: unpaid volunteer posting, not employment", english: false },
  { id: 1300, job_title: "Directeur d'EHPAD F/H", company: "Les Bruyères Association", source: "Indeed", location: "Sassenage (38)", salary: "De 55 000 € à 60 000 € par an", job_url: "Not available", alert_keyword: "finance director", red_flags: ["Off-topic"], notes: "Auto-dismissed: unrelated role (nursing home / medical facility director)", english: false },
];

// Consolidated duplicates (same underlying job as a row above) — mark processed only, no insert
const consolidatedDupIds = [1231,1232,1277,1278,1279,1260, 1235,1258, 1236, 1281, 1286, 1288, 1269, 1312];

// Cadremploi rows with no extractable content — leave a trace, don't silently drop
const cadremploiEmptyIds = [1243,1245,1250,1252,1256,1270,1271,1272];

const newCompanies = [
  { company: "CRISTAL HABITAT", location: "Chambéry (73)" },
  { company: "Team.is", location: "Voiron" },
  { company: "New-slot Recrutement", location: "Seyssinet-Pariset" },
  { company: "Coopérative U", location: "Biol" },
  { company: "Centre Hospitalier Universitaire de Grenoble", location: "La Tronche (38)" },
  { company: "MSA Alpes du Nord", location: "Échirolles" },
  { company: "BioLogic", location: "Seyssinet-Pariset" },
  { company: "Ortec Group", location: "Grenoble" },
  { company: "Grenoble-Alpes Métropole", location: "Grenoble" },
  { company: "Fed Finance", location: "Eybens" },
  { company: "Groupe MG", location: "Grenoble" },
  { company: "Grafton", location: "Sassenage (38)" },
  { company: "Rhenus Logistics", location: "Vaulx-Milieu" },
];

async function main() {
  await client.connect();
  let rqInserted = 0, jaDismissed = 0, errors = [];

  for (const r of reviewQueue) {
    try {
      await client.query(
        `INSERT INTO review_queue
         (job_title,company,source,location,salary,priority,status,date_added,
          job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id,user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_DATE,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [r.job_title, r.company, r.source, r.location, r.salary, r.priority, r.status,
         r.job_url, null, JSON.stringify(r.red_flags || []), JSON.stringify(r.missing_info || []),
         r.alert_keyword, r.notes, r.english, null, r.id, USER_PROFILE]
      );
      await client.query(`UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2`, [r.id, USER_PROFILE]);
      rqInserted++;
    } catch (e) { errors.push({ id: r.id, table: 'review_queue', error: e.message }); }
  }

  for (const d of dismissed) {
    try {
      await client.query(
        `INSERT INTO job_applications
         (job_title,company,source,location,salary,priority,cv_approach,status,date_added,
          job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id,user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_DATE,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [d.job_title, d.company, d.source, d.location, d.salary, 'C', 'Standard', 'Dismissed',
         d.job_url, null, JSON.stringify(d.red_flags || []), JSON.stringify([]),
         d.alert_keyword, d.notes, d.english, null, d.id, USER_PROFILE]
      );
      await client.query(`UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2`, [d.id, USER_PROFILE]);
      jaDismissed++;
    } catch (e) { errors.push({ id: d.id, table: 'job_applications', error: e.message }); }
  }

  await client.query(`UPDATE listing_inbox SET parse_status='processed' WHERE id = ANY($1) AND user_profile=$2`, [consolidatedDupIds, USER_PROFILE]);
  await client.query(`UPDATE listing_inbox SET parse_status='manual_check', parse_notes='Cadremploi — no extractable data (pre-Puppeteer era row), verify apec.fr/cadremploi.fr manually or discard' WHERE id = ANY($1) AND user_profile=$2`, [cadremploiEmptyIds, USER_PROFILE]);

  let companiesInserted = 0;
  for (const c of newCompanies) {
    try {
      await client.query(
        `INSERT INTO target_companies (company, tier, location, notes, user_profile) VALUES ($1,'C',$2,$3,$4)`,
        [c.company, c.location, 'Auto-captured from daily scan 2026-07-04', USER_PROFILE]
      );
      companiesInserted++;
    } catch (e) { errors.push({ company: c.company, table: 'target_companies', error: e.message }); }
  }

  console.log(JSON.stringify({
    review_queue_inserted: rqInserted,
    job_applications_dismissed: jaDismissed,
    consolidated_duplicates: consolidatedDupIds.length,
    cadremploi_empty_marked: cadremploiEmptyIds.length,
    new_companies_captured: companiesInserted,
    errors
  }, null, 2));

  await client.end();
}
main().catch(e => { console.error(e); process.exit(1); });
