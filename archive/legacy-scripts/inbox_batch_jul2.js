'use strict';
const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const db = new Client({ connectionString: cfg.supabase_connection_string });
const U = cfg.user.profile_id;
const DATE = '2026-07-02';

const indeed16 = JSON.parse(fs.readFileSync('C:/Users/zberl/AppData/Local/Temp/claude/C--Users-zberl-OneDrive-Documents-Code-Grenoble-job-search/db6c7362-7978-46b5-b5ae-211b9b452c18/scratchpad/indeed16_parsed.json', 'utf8'));

const thread = (id) => `https://mail.google.com/mail/u/0/#all/${id}`;

// columns: gmail_thread_id, source, alert_keyword, job_title, company, salary, location, job_url, contract_type, parse_status, parse_notes, raw_snippet, raw_body, english
const rows = [];

// -- Indeed thread 1 (2 listings) --
rows.push(['19f24e12b5120845','Indeed','Contrôleur de Gestion','Contrôleur de gestion H/F','Grafton','De 42 000 € à 48 000 € par an','Sassenage (38)','https://fr.indeed.com/pagead/clk/dl?mo=r&ad=NYlbfkN0BgixFXyPrcENGFVu5q-RHavWQqs4xEGD5YVI2vA7a5TmAYwYadNg-45didr81C6vvcwKmIk03Hu3z-G4UQnhr3FKBhK68Ek0-fAYfj7w0ePvyJ0Z2a3Fn7rK6DT9PHCPKUbKUsyDPI4peKGvanZGIAj5O-igYrTD5a9Nf9rrWBXYUzeSlHefo0YcbDXLyDkKTyK3R79UynUojsRX0RuijTtjnoi1_rOXg9c4yuSGOz6ONY1cNgjpffgKq2aOYNirJHR8whoZOsDOXLxW45LMUW6z_OhLowTccOCp3lpRVBYxCSOdfqNK-9Yj-DIt5txRYa9xYTRinYoIJF3PqVlJII0FDmw4X3YGu9FOU13FqYga7d4Ax_rU-cYzYiAqWlo81oKzvjnaWmhGQXPu2zg48AoJzSSWHXWEDZBffxnpFYeZMIL04pcyI8pHGfutFlR5u5reQKCw&rm=2&tk=1jsie29g2k7m4800&plid=indeed-jobalert','CDI','pending',null,'Grafton Recruitment, spécialiste de l’intérim et du recrutement de profils juniors à professionnels confirmés, recherche un Contrôleur de gestion H/F sur…','Contrôleur de Gestion à Grenoble (38) : 2 nouvelles offres d\'emploi | Postulez aux offres publiées par Grafton et Université Grenoble Alpes',false]);
rows.push(['19f24e12b5120845','Indeed','Contrôleur de Gestion','Responsable du service financier (f/h)','Université Grenoble Alpes','À partir de 1 944 € par mois','Gières (38)','https://fr.indeed.com/rc/clk/dl?jk=b0fcec8de0bf0e&from=ja&rd=cv__WBhDSvE4qmpjGmxYvJXef5NkBUPQ3HkIyXCDpdM&tk=1jsie29g2k7m4800','CDI','pending',null,'Sous l’autorité de la Directrice Administrative, vous assurerez la mise en œuvre des missions du service et l’encadrement de l’équipe composée de 4 personnes (2…','Contrôleur de Gestion à Grenoble (38) : 2 nouvelles offres d\'emploi | Postulez aux offres publiées par Grafton et Université Grenoble Alpes',false]);

// -- LinkedIn digest jobs (10) --
rows.push(['19f246379f3ee37f','LinkedIn','LinkedIn','Directeur Administratif et financier','Fed Finance','€70K-€100K/year','Eybens','https://www.linkedin.com/jobs/view/4435535047/',null,'pending',null,'Directeur Administratif et financier at Fed Finance — up to €100K/year','Directeur Administratif et financier at Fed Finance: up to €100K/year | €70K-€100K / year salary',false]);
rows.push(['19f246379f3ee37f','LinkedIn','LinkedIn','Directeur(trice) Administratif(ve) et Gestion F/H','Groupe SAMSE',null,'Échirolles','https://www.linkedin.com/jobs/view/4432340640/',null,'pending',null,'Directeur(trice) Administratif(ve) et Gestion F/H at Groupe SAMSE','LinkedIn job alert digest | Directeur(trice) Administratif(ve) et Gestion F/H — Groupe SAMSE',false]);
rows.push(['19f22ac0a23c8f18','LinkedIn','LinkedIn','Manager Achats Indirects (H/F)','LYNRED',null,'Greater Grenoble Metropolitan Area','https://www.linkedin.com/jobs/view/4431209532/',null,'pending',null,'LYNRED Manager Achats Indirects (H/F)','Manager Achats Indirects (H/F) at LYNRED | LYNRED Manager Achats Indirects (H/F)',false]);
rows.push(['19f246379f3ee37f','LinkedIn','LinkedIn','Responsable comptable H/F','Team.is',null,'Voiron','https://www.linkedin.com/jobs/view/4434613770/',null,'pending',null,'Responsable comptable H/F at Team.is','LinkedIn job alert digest | Responsable comptable H/F — Team.is',false]);
rows.push(['19f246379f3ee37f','LinkedIn','LinkedIn','Manager comptable H/F','Groupe MG',null,'Grenoble','https://www.linkedin.com/jobs/view/4432356667/',null,'pending',null,'Manager comptable H/F at Groupe MG','LinkedIn job alert digest | Manager comptable H/F — Groupe MG',false]);
rows.push(['19f246379f3ee37f','LinkedIn','LinkedIn','Chef(fe) de mission comptable - H/F','New-slot Recrutement',null,'Seyssinet-Pariset','https://www.linkedin.com/jobs/view/4434606543/',null,'pending',null,'Chef(fe) de mission comptable - H/F at New-slot Recrutement','LinkedIn job alert digest | Chef de mission comptable — New-slot Recrutement',false]);
rows.push(['19f23f5b76dc7862','LinkedIn','LinkedIn','Responsable comptable H/F','Coopérative U',null,'Biol','https://www.linkedin.com/jobs/view/4435838402/',null,'pending',null,'Responsable comptable H/F at Coopérative U','LinkedIn job alert digest | Responsable comptable H/F — Coopérative U',false]);
rows.push(['19f223e1f79b19fb','LinkedIn','LinkedIn','Sourcing Manager F/M','Hexcel Corporation',null,'Les Avenières','https://www.linkedin.com/jobs/view/4413539733/',null,'pending',null,'Sourcing Manager F/M at Hexcel Corporation','LinkedIn job alert digest | Sourcing Manager F/M — Hexcel Corporation',false]);
rows.push(['19f21d04c31a4090','LinkedIn','LinkedIn','Chef de Projet Logistique H/F','Rhenus Logistics',null,'Vaulx-Milieu','https://www.linkedin.com/jobs/view/4435819638/',null,'pending',null,'Chef de Projet Logistique H/F at Rhenus Logistics','LinkedIn job alert digest | Chef de Projet Logistique H/F — Rhenus Logistics',false]);
rows.push(['19f21d04c31a4090','LinkedIn','LinkedIn','DIRECTEUR DE SITE LOGISTIQUE H/F - CHATEAUBOURG (35)','Sonepar France',null,'Rives','https://www.linkedin.com/jobs/view/4432321287/',null,'pending',null,'DIRECTEUR DE SITE LOGISTIQUE H/F at Sonepar France','LinkedIn job alert digest | Directeur de Site Logistique — Sonepar France',false]);

// -- HelloWork subject-parsed (2) --
rows.push(['19f22879414f3293','Direct','HelloWork','Responsable Administratif et Financier','Adsearch',null,null,'Not available',null,'pending','Subject-parsed (HTML-only body — verify location/salary)','1 nouvelle offre correspond à votre profil. Responsable Administratif','Zachary, Adsearch recrute un Responsable Administratif et Financier H/F | 1 nouvelle offre correspond à votre profil. Responsable Administratif',false]);
rows.push(['19f21ad24cfb3785','Direct','HelloWork','Manager Comptable','Groupe MG',null,null,'Not available',null,'pending','Subject-parsed (HTML-only body — verify location/salary); 1 of 6 listed offers recoverable from subject — remaining 5 unrecoverable without Puppeteer','6 nouvelles offres correspondent à votre profil. Manager Comptable H/F','Zachary, Groupe MG recrute un Manager Comptable H/F | 6 nouvelles offres correspondent à votre profil. Manager Comptable H/F',false]);

// -- Cadremploi puppeteer_pending (3, sender matches HTML_ONLY_SOURCES) --
rows.push(['19f2374181d13a70','Cadremploi','Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable',null,null,null,null,null,null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction','Ces entreprises recherchent encore des candidats ! Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR','Votre profil intéresse ces entreprises ! | Et leurs offres pourraient vous intéresser Cadremploi Ces entreprises recherchent encore des candidats !',false]);
rows.push(['19f225e6e912c721','Cadremploi','Responsable Administratif Financier OR RAF',null,null,null,null,null,null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction (4 bundled saved-search notifications in this thread)','Aucune offre ne correspond à votre recherche. Mais voici celles trouvées en modifiant vos critères. Responsable Administratif Financier OR RAF','Et si vous modifiez vos critères de recherche ? | 3 offres d\'emploi trouvées — 4 bundled alert variants (RAF, Supply Chain, Credit Manager, Achats)',false]);
rows.push(['19f21fc9f2c28060','Cadremploi','Responsable Administratif et Financier OR RAF OR Responsable Consolidation OR Responsable Trésorerie',null,null,null,null,null,null,'puppeteer_pending','Known HTML-only source — queued for Puppeteer extraction (2 bundled saved-search notifications in this thread)','Postulez dès maintenant Cadremploi 2 offres à ne rater sous aucun prétexte ! Responsable Administratif et Financier OR RAF','2 offres à ne rater sous aucun prétexte ! | 2 bundled alert variants (RAF/Consolidation/Trésorerie, DAF/Finance Director/Chef Comptable)',false]);

// -- APEC manual_check (1) --
rows.push(['19f21f9b03df5623','APEC','APEC',null,null,null,null,null,null,'manual_check','APEC: 4 offres — APEC — HTML-only — check apec.fr manually','Découvrez votre sélection d\'offres. Voici une sélection d\'offres d\'emploi 1 offre correspond à votre recherche','4 offres Apec du 02/07/2026 | Découvrez votre sélection d\'offres. 1 offre correspond à votre recherche',false]);

// -- Not job listings — manual_check, no fields (3) --
rows.push(['19f22d381e54cf41','Direct','HelloWork',null,null,null,null,null,null,'manual_check','Non-job newsletter content — no listing data','15 minutes de lecture pour vous aider à choisir votre job','Deux nouveaux droits entrés en vigueur ce 1er juillet | 15 minutes de lecture pour vous aider à choisir votre job',false]);
rows.push(['19f21de8dcd83034','Direct','HelloWork',null,null,null,null,null,null,'manual_check','Non-job profile-view notification — no listing data','2 recruteurs viennent de consulter votre profil','2 recruteurs viennent de consulter votre cv | 2 recruteurs viennent de consulter votre profil',false]);
rows.push(['19f2029dffd0e0de','Direct','Glassdoor',null,null,null,null,null,null,'manual_check','Non-job employer-review newsletter content — no listing data','Découvrez les dernières actualités pour Epitech','Nouveau chez Epitech : les avis des employés de cette semaine, et plus encore | Découvrez les dernières actualités pour Epitech',false]);

// -- Indeed 16-offer digest (15 unique; index 3 = UGA "Responsable du service financier" excluded as in-batch duplicate of thread1 listing) --
indeed16.forEach((r, i) => {
  if (i === 3) return; // duplicate of thread 19f24e12b5120845 Listing B (same job, same URL)
  rows.push(['19f244a3228dd22f','Indeed','finance director',r.title,r.company,r.salary,r.location,r.url,null,'pending',null,null,'finance director à Grenoble (38) : 16 nouvelles offres d\'emploi | Postulez aux offres publiées par CHRISTAUD, SIMC et Groupe Samse',false]);
});

async function main() {
  await db.connect();

  // URL dedup: check all real job_urls against listing_inbox (last 7 days) + job_applications
  const urls = [...new Set(rows.map(r => r[7]).filter(u => u && u !== 'Not available'))];
  const dupRes = await db.query(
    `SELECT job_url FROM (
       SELECT job_url FROM listing_inbox WHERE job_url = ANY($1) AND parse_date >= CURRENT_DATE - 7 AND user_profile=$2
       UNION ALL
       SELECT job_url FROM job_applications WHERE job_url = ANY($1) AND user_profile=$2
     ) t`,
    [urls, U]
  );
  const dupSet = new Set(dupRes.rows.map(x => x.job_url));

  let inserted = 0, urlDedup = 0, errors = [];
  const statusCounts = {};
  for (const r of rows) {
    const [gmail_thread_id, source, alert_keyword, job_title, company, salary, location, job_url, contract_type, parse_status, parse_notes, raw_snippet, raw_body, english] = r;
    if (job_url && job_url !== 'Not available' && dupSet.has(job_url)) { urlDedup++; continue; }
    const gmail_thread_url = thread(gmail_thread_id);
    try {
      const res = await db.query(
        `INSERT INTO listing_inbox
         (parse_date,gmail_thread_id,gmail_thread_url,source,alert_keyword,job_title,company,salary,location,job_url,contract_type,parse_status,parse_notes,raw_snippet,raw_body,english,user_profile)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         ON CONFLICT DO NOTHING RETURNING id`,
        [DATE, gmail_thread_id, gmail_thread_url, source, alert_keyword, job_title, company, salary, location, job_url, contract_type, parse_status, parse_notes, raw_snippet, raw_body, english, U]
      );
      if (res.rowCount > 0) {
        inserted++;
        statusCounts[parse_status] = (statusCounts[parse_status] || 0) + 1;
      }
    } catch (e) {
      errors.push(`${gmail_thread_id} (${job_title}): ${e.message}`);
    }
  }

  console.log(JSON.stringify({ inserted, urlDedup, statusCounts, errors }, null, 1));
  await db.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
