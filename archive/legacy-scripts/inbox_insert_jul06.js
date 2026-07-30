const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const { Client } = require(config.pg_module_path);
const c = new Client({ connectionString: config.supabase_connection_string });
const USER_PROFILE = config.user.profile_id;
const PARSE_DATE = '2026-07-06';

const gurl = (id) => `https://mail.google.com/mail/u/0/#all/${id}`;

const rows = [
  {
    thread: '19f38968b8aecedb', source: 'LinkedIn', alert_keyword: 'LinkedIn',
    job_title: 'Contrôleur de Gestion - R&D et Fonctions Corporate (H/F)', company: 'Radiall',
    location: 'Voreppe', salary: null, contract_type: null, english: false,
    job_url: 'https://www.linkedin.com/jobs/view/4433702131/',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: 'Contrôleur de Gestion - R&D et Fonctions Corporate (H/F) / Radiall / Voreppe / actively hiring',
    raw_body: 'Contrôleur de Gestion - R&D et Fonctions Corporate (H/F)\nRadiall\nVoreppe\nThis company is actively hiring\nView job: https://www.linkedin.com/jobs/view/4433702131/'
  },
  {
    thread: '19f388f287e47226', source: 'LinkedIn', alert_keyword: 'Responsable Supply Chain',
    job_title: 'Responsable Logisticiens projets F/H', company: 'Framatome',
    location: 'Grenoble', salary: null, contract_type: null, english: false,
    job_url: 'https://www.linkedin.com/jobs/view/4417139039/',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: 'Responsable Logisticiens projets F/H / Framatome / Grenoble / actively hiring',
    raw_body: 'Your job alert for Responsable Supply Chain OR Supply Chain Manager OR Demand Planner OR Responsable S&OP OR Chef de Projet ERP OR Auditeur Interne in Greater Grenoble Metropolitan Area\nResponsable Logisticiens projets F/H\nFramatome\nGrenoble'
  },
  {
    thread: '19f374572cb78633', source: 'LinkedIn', alert_keyword: 'Responsable Supply Chain',
    job_title: 'Responsable Logisticiens projets F/H', company: 'Framatome',
    location: 'Grenoble', salary: null, contract_type: null, english: false,
    job_url: 'https://www.linkedin.com/jobs/view/4417139039/',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: 'Responsable Logisticiens projets F/H / Framatome / Grenoble / actively hiring',
    raw_body: 'Your job alert for Responsable Supply Chain OR Supply Chain Manager OR Demand Planner in Grenoble\nResponsable Logisticiens projets F/H\nFramatome\nGrenoble'
  },
  {
    thread: '19f382129fd400e4', source: 'LinkedIn', alert_keyword: 'Financial Controller',
    job_title: 'Senior Commercial Finance Manager JORDAN', company: 'The Global Search Company',
    location: 'EMEA', salary: null, contract_type: null, english: true,
    job_url: 'https://www.linkedin.com/jobs/view/4436999425/',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: 'Senior Commercial Finance Manager JORDAN / The Global Search Company / EMEA',
    raw_body: 'Your job alert for Financial Controller OR Finance Manager OR Accounting Manager OR FP&A Manager OR Cost Controller OR P2P Manager OR Credit Manager OR Procurement Manager OR Finance Governance in Grenoble\nSenior Commercial Finance Manager JORDAN\nThe Global Search Company\nEMEA'
  },
  {
    thread: '19f37b4635ac046a', source: 'LinkedIn', alert_keyword: 'Responsable Administratif et Financier',
    job_title: 'Direction Générale Fédération ACEPP 38', company: 'ACEPP 38',
    location: 'Saint-Jean-de-Moirans', salary: null, contract_type: null, english: false,
    job_url: 'https://www.linkedin.com/jobs/view/4436991732/',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: 'Direction Générale Fédération ACEPP 38 / ACEPP 38 / Saint-Jean-de-Moirans',
    raw_body: 'Your job alert for Responsable Administratif et Financier OR RAF OR Chef Comptable OR Responsable Budget et Reporting OR Responsable Consolidation OR Responsable Trésorerie in Greater Grenoble Metropolitan Area\nDirection Générale Fédération ACEPP 38\nACEPP 38\nSaint-Jean-de-Moirans'
  },
  {
    thread: '19f3669b7615eeee', source: 'LinkedIn', alert_keyword: 'Responsable Administratif Financier',
    job_title: 'Direction Générale Fédération ACEPP 38', company: 'ACEPP 38',
    location: 'Saint-Jean-de-Moirans', salary: null, contract_type: null, english: false,
    job_url: 'https://www.linkedin.com/jobs/view/4436991732/',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: 'Direction Générale Fédération ACEPP 38 / ACEPP 38 / Saint-Jean-de-Moirans',
    raw_body: 'Your job alert for Responsable Administratif Financier OR RAF OR Responsable Financier OR Directeur Financier OR Responsable Comptabilité OR Chef Comptable in Grenoble\nDirection Générale Fédération ACEPP 38\nACEPP 38\nSaint-Jean-de-Moirans'
  },
  {
    thread: '19f36d78f513dbef', source: 'LinkedIn', alert_keyword: 'Contrôleur de Gestion',
    job_title: 'Contrôleur de gestion junior - Reporting - FP&A (H/F)', company: 'HM.CLAUSE',
    location: 'Portes-lès-Valence', salary: null, contract_type: null, english: false,
    job_url: 'https://www.linkedin.com/jobs/view/4433741287/',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: 'Contrôleur de gestion junior - Reporting - FP&A (H/F) / HM.CLAUSE / Portes-lès-Valence',
    raw_body: 'Your job alert for Contrôleur de Gestion OR Pilote Financier OR Responsable FP&A OR Finance Business Partner OR Analyste Financier in Greater Grenoble Metropolitan Area\nContrôleur de gestion junior - Reporting - FP&A (H/F)\nHM.CLAUSE\nPortes-lès-Valence'
  },
  {
    thread: '19f36f9e0206f8a4', source: 'HelloWork', alert_keyword: 'HelloWork',
    job_title: 'Gestionnaire de Flux Responsable des Flux H/F', company: 'Work 2000 Chatte',
    location: null, salary: null, contract_type: null, english: false,
    job_url: 'Not available',
    parse_status: 'pending', parse_notes: 'Subject-parsed (HTML-only body — verify location/salary)',
    raw_snippet: "Nous avons trouvé de nouvelles offres d'emploi qui pourraient vous intéresser ! Hello Zachary ! 1 nouvelle offre correspond à votre profil. Gestionnaire de Flux",
    raw_body: "Zachary, Work 2000 Chatte recrute un Gestionnaire de Flux Responsable des Flux H/F | Nous avons trouvé de nouvelles offres d'emploi qui pourraient vous intéresser ! Logo Hellowork Logo Hellowork Hello Zachary ! 1 nouvelle offre correspond à votre profil. Gestionnaire de Flux"
  },
  // Indeed multi-listing digest — 12 jobs, thread 19f38802d0d62546
  {
    thread: '19f38802d0d62546', source: 'Indeed', alert_keyword: 'finance director',
    job_title: 'Responsable Finance H/F', company: 'CRISTAL HABITAT',
    location: 'Chambéry (73)', salary: '52000-58000 EUR/an', contract_type: null, english: false,
    job_url: 'https://fr.indeed.com/rc/clk/dl?jk=m91d94567b88be0',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: 'Responsable Finance H/F / CRISTAL HABITAT - Chambéry (73) / De 52 000 € à 58 000 € par an',
    raw_body: null
  },
  {
    thread: '19f38802d0d62546', source: 'Indeed', alert_keyword: 'finance director',
    job_title: 'Responsable du service financier (f/h)', company: 'Université Grenoble Alpes',
    location: 'Gières (38)', salary: '1944 EUR/mois (à partir de)', contract_type: null, english: false,
    job_url: 'https://fr.indeed.com/rc/clk/dl?jk=wb0fcec8de0bf0e',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: 'Responsable du service financier (f/h) / Université Grenoble Alpes - Gières (38) / À partir de 1 944 € par mois',
    raw_body: null
  },
  {
    thread: '19f38802d0d62546', source: 'Indeed', alert_keyword: 'finance director',
    job_title: "Directeur de magasin St Martin d'Heres (H/F)", company: 'Wise RH',
    location: "Saint-Martin-d'Hères (38)", salary: '40000 EUR/an', contract_type: null, english: false,
    job_url: 'https://fr.indeed.com/rc/clk/dl?jk=9953ae16d83ac4',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: "Directeur de magasin St Martin d'Heres (H/F) / Wise RH - Saint-Martin-d'Hères (38) / 40 000 € par an",
    raw_body: null
  },
  {
    thread: '19f38802d0d62546', source: 'Indeed', alert_keyword: 'finance director',
    job_title: "Directeur d'EHPAD F/H", company: 'Les Bruyères Association',
    location: 'Sassenage (38)', salary: '55000-60000 EUR/an', contract_type: 'CDI', english: false,
    job_url: 'https://fr.indeed.com/pagead/clk/dl?ad_id_unavailable_see_thread_19f38802d0d62546',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: "Directeur d'EHPAD F/H / Les Bruyères Association - Sassenage (38) / De 55 000 € à 60 000 € par an",
    raw_body: null
  },
  {
    thread: '19f38802d0d62546', source: 'Indeed', alert_keyword: 'finance director',
    job_title: 'DIRECTEUR DE MAGASIN F/H', company: 'Centrakor',
    location: "Saint-Martin-d'Hères (38)", salary: null, contract_type: null, english: false,
    job_url: 'https://fr.indeed.com/pagead/clk/dl?ad_id_unavailable_see_thread_19f38802d0d62546_2',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: "DIRECTEUR DE MAGASIN F/H / Centrakor - Saint-Martin-d'Hères (38)",
    raw_body: null
  },
  {
    thread: '19f38802d0d62546', source: 'Indeed', alert_keyword: 'finance director',
    job_title: 'Directeur Exécution et Qualité Budgétaire (f/h)', company: 'Université Grenoble Alpes',
    location: 'Gières (38)', salary: '1944 EUR/mois (à partir de)', contract_type: 'CDD', english: false,
    job_url: 'https://fr.indeed.com/rc/clk/dl?jk=896a3ed43ef09b',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: 'Directeur Exécution et Qualité Budgétaire (f/h) / Université Grenoble Alpes - Gières (38) / À partir de 1 944 € par mois',
    raw_body: null
  },
  {
    thread: '19f38802d0d62546', source: 'Indeed', alert_keyword: 'finance director',
    job_title: 'Directeur adjoint de magasin H/F', company: 'JM INVEST',
    location: 'Grenoble (38)', salary: '2933-3550 EUR/mois', contract_type: null, english: false,
    job_url: 'https://fr.indeed.com/rc/clk/dl?jk=F8554faa6f4c515',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: 'Directeur adjoint de magasin H/F / JM INVEST - Grenoble (38) / De 2 933,00 € à 3 550,01 € par mois',
    raw_body: null
  },
  {
    thread: '19f38802d0d62546', source: 'Indeed', alert_keyword: 'finance director',
    job_title: 'Directeur / Directrice de crèche EJE en CDI — H/F', company: 'Zanaka Solutions RH',
    location: 'Eybens (38)', salary: '2500 EUR/mois (à partir de)', contract_type: 'CDI', english: false,
    job_url: 'https://fr.indeed.com/rc/clk/dl?jk=27c92dec57ca86',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: 'Directeur / Directrice de crèche EJE en CDI — H/F / Zanaka Solutions RH - Eybens (38) / À partir de 2 500 € par mois',
    raw_body: null
  },
  {
    thread: '19f38802d0d62546', source: 'Indeed', alert_keyword: 'finance director',
    job_title: 'Directeur adjoint H/F', company: "Les Etoiles d'Hestia",
    location: 'Montmélian (73)', salary: null, contract_type: null, english: false,
    job_url: 'https://fr.indeed.com/rc/clk/dl?jk=05a6605b82ecdf',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: "Directeur adjoint H/F / Les Etoiles d'Hestia - Montmélian (73)",
    raw_body: null
  },
  {
    thread: '19f38802d0d62546', source: 'Indeed', alert_keyword: 'finance director',
    job_title: 'Directeur Expertise comptable - Saint-Martin (971) H/F', company: 'Fiducial',
    location: "Saint-Martin-d'Hères (38)", salary: null, contract_type: null, english: false,
    job_url: 'https://fr.indeed.com/pagead/clk/dl?ad_id_unavailable_see_thread_19f38802d0d62546_3',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: "Directeur Expertise comptable - Saint-Martin (971) H/F / Fiducial - Saint-Martin-d'Hères (38)",
    raw_body: null
  },
  {
    thread: '19f38802d0d62546', source: 'Indeed', alert_keyword: 'finance director',
    job_title: 'Responsable pôle Accueil et Administratif', company: 'MJC des Eaux Claires',
    location: 'Grenoble (38)', salary: '2184 EUR/mois', contract_type: null, english: false,
    job_url: 'https://fr.indeed.com/rc/clk/dl?jk=Pf37715725e9da3',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: 'Responsable pôle Accueil et Administratif / MJC des Eaux Claires - Grenoble (38) / 2 184 € par mois',
    raw_body: null
  },
  {
    thread: '19f38802d0d62546', source: 'Indeed', alert_keyword: 'finance director',
    job_title: 'Directeur junior de village vacances H/F', company: 'CEVEO',
    location: 'Allevard (38)', salary: '2900 EUR/mois', contract_type: null, english: false,
    job_url: 'https://fr.indeed.com/rc/clk/dl?jk=cecf9d6f4c0dcf',
    parse_status: 'pending', parse_notes: null,
    raw_snippet: 'Directeur junior de village vacances H/F / CEVEO - Allevard (38) / 2 900 € par mois',
    raw_body: null
  }
];

const INDEED_FULL_BODY = "Indeed Job Alert\n12 nouveaux emplois finance director - Grenoble (38)\n\nJobs 1-12 of 12 new jobs\n(full body truncated — 12 listings extracted individually, see parse_notes)".slice(0, 8000);

// Cadremploi HTML-only consolidated rows (one per thread, per known-HTML-only-source rule)
const cadremploiRows = [
  { thread: '19f37d3fb53be97e', subject: 'Votre profil intéresse ces entreprises !', snippet: "Et leurs offres pourraient vous intéresser Cadremploi Ces entreprises recherchent encore des candidats ! Responsable Administratif et Financier OR RAF OR Responsable Consolidation OR Responsable / Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR" },
  { thread: '19f36f78ccc21720', subject: 'Et si vous modifiez vos critères de recherche ?', snippet: "3 offres d'emploi trouvées Cadremploi Aucune offre ne correspond à votre recherche. Mais voici celles trouvées en modifiant vos critères. Credit Manager OR Responsable Recouvrement / Responsable Supply Chain / Responsable Administratif Financier OR RAF / Responsable Achats OR Acheteur Senior" },
  { thread: '19f3683fcf9be19e', subject: '1 offre à ne rater sous aucun prétexte', snippet: "Postulez dès maintenant Cadremploi 1 offre à ne rater sous aucun prétexte Contrôleur de Gestion OR Pilote Financier OR Responsable FP&A OR Finance Business Partner OR Analyste Financier, Isère / Contrôleur de Gestion OR Responsable Contrôle de Gestion OR Contrôleur de Gestion Industriel OR Finance Business Partner" },
  { thread: '19f3683cf93da9cd', subject: '2 offres à ne rater sous aucun prétexte !', snippet: "Postulez dès maintenant Cadremploi 2 offres à ne rater sous aucun prétexte ! Responsable Administratif et Financier OR RAF OR Responsable Consolidation OR Responsable Trésorerie OR Responsable" },
  { thread: '19f35cd061a01f4e', subject: 'Une nouvelle offre a été publiée la semaine dernière', snippet: "Soyez le premier à postuler ! Cadremploi Une nouvelle offre a été publiée la semaine dernière Contrôleur de Gestion OR Responsable Contrôle de Gestion OR Contrôleur de Gestion Industriel OR Finance / Contrôleur de Gestion OR Pilote Financier OR Responsable FP&A OR Finance Business Partner" }
];

async function main() {
  await c.connect();
  const results = { pending: 0, puppeteer_pending: 0, manual_check: 0, url_dedup: 0, errors: [] };

  for (const r of rows) {
    if (r.job_url && r.job_url !== 'Not available') {
      const dedupCheck = await c.query(
        `SELECT id FROM (
           SELECT id FROM listing_inbox WHERE job_url=$1 AND parse_date >= CURRENT_DATE - 7 AND user_profile=$2
           UNION ALL
           SELECT id FROM job_applications WHERE job_url=$1 AND user_profile=$2
         ) t LIMIT 1`,
        [r.job_url, USER_PROFILE]
      );
      if (dedupCheck.rows.length > 0) {
        results.url_dedup++;
        continue;
      }
    }
    const raw_body = (r.raw_body || INDEED_FULL_BODY).slice(0, 8000);
    const raw_snippet = r.raw_snippet.slice(0, 200);
    try {
      await c.query(
        `INSERT INTO listing_inbox
         (parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
          job_title, company, location, salary, job_url, contract_type,
          parse_status, parse_notes, english, raw_snippet, raw_body, user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [PARSE_DATE, r.thread, gurl(r.thread), r.source, r.alert_keyword,
         r.job_title, r.company, r.location, r.salary, r.job_url, r.contract_type,
         r.parse_status, r.parse_notes, r.english, raw_snippet, raw_body, USER_PROFILE]
      );
      results[r.parse_status] = (results[r.parse_status] || 0) + 1;
    } catch (e) {
      results.errors.push({ title: r.job_title, thread: r.thread, error: e.message });
    }
  }

  for (const cr of cadremploiRows) {
    const raw_body = (cr.subject + ' | ' + cr.snippet).slice(0, 500);
    const raw_snippet = cr.snippet.slice(0, 200);
    try {
      await c.query(
        `INSERT INTO listing_inbox
         (parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
          job_title, company, location, salary, job_url, contract_type,
          parse_status, parse_notes, english, raw_snippet, raw_body, user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [PARSE_DATE, cr.thread, gurl(cr.thread), 'Cadremploi', 'Cadremploi',
         null, null, null, null, 'Not available', null,
         'puppeteer_pending', 'Known HTML-only source — queued for Puppeteer extraction', false,
         raw_snippet, raw_body, USER_PROFILE]
      );
      results.puppeteer_pending++;
    } catch (e) {
      results.errors.push({ title: '(Cadremploi)', thread: cr.thread, error: e.message });
    }
  }

  // APEC summary row
  const apecSubject = '1 offre Apec du 06/07/2026';
  const apecSnippet = "Découvrez votre sélection d'offres. Voici une sélection d'offres d'emploi 1 offre correspond à votre recherche : Alert 4 — English titles";
  try {
    await c.query(
      `INSERT INTO listing_inbox
       (parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
        job_title, company, location, salary, job_url, contract_type,
        parse_status, parse_notes, english, raw_snippet, raw_body, user_profile)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [PARSE_DATE, '19f35c98aeaf7a78', gurl('19f35c98aeaf7a78'), 'APEC', 'Alert 4 — English titles',
       null, null, null, null, 'Not available', null,
       'manual_check', 'APEC: 1 offre — Alert 4 — English titles — HTML-only — check apec.fr manually', false,
       apecSnippet.slice(0, 200), (apecSubject + ' | ' + apecSnippet).slice(0, 500), USER_PROFILE]
    );
    results.manual_check++;
  } catch (e) {
    results.errors.push({ title: '(APEC)', thread: '19f35c98aeaf7a78', error: e.message });
  }

  console.log(JSON.stringify(results, null, 2));
  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
