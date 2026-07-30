const {Client} = require(process.env.PG_MODULE);
const c = new Client({connectionString: process.env.PG_CONN});

const USER_PROFILE = 'zberlo';

const updates = [
  // Cadremploi single "DAF Retail" repeats
  {id:1626, job_title:'DAF Retail (H/F)', company:'LHH', location:'Voiron', contract_type:'CDI', alert_keyword:'DAF/Finance Director', raw_body:"Cadremploi alert — Isère search (Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR Responsable Budget et Reporting), CDI, >50000€\n\nDAF Retail (H/F)\nLHH • Voiron • CDI"},
  {id:1631, job_title:'DAF Retail (H/F)', company:'LHH', location:'Voiron', contract_type:'CDI', alert_keyword:'DAF/Finance Director', raw_body:"Cadremploi alert — Isère search (Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR Responsable Budget et Reporting), CDI, >50000€\n\nDAF Retail (H/F)\nLHH • Voiron • CDI"},
  {id:1636, job_title:'DAF Retail (H/F)', company:'LHH', location:'Voiron', contract_type:'CDI', alert_keyword:'DAF/Finance Director', raw_body:"Cadremploi alert — Isère search (Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR Responsable Budget et Reporting), CDI, >50000€\n\nDAF Retail (H/F)\nLHH • Voiron • CDI"},
  {id:1641, job_title:'DAF Retail (H/F)', company:'LHH', location:'Voiron', contract_type:'CDI', alert_keyword:'DAF/Finance Director', raw_body:"Cadremploi alert — Isère search (Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR Responsable Budget et Reporting), CDI, >50000€\n\nDAF Retail (H/F)\nLHH • Voiron • CDI"},
  {id:1646, job_title:'DAF Retail (H/F)', company:'LHH', location:'Voiron', contract_type:'CDI', alert_keyword:'DAF/Finance Director', raw_body:"Cadremploi alert — Isère search (Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR Responsable Budget et Reporting), CDI, >50000€\n\nDAF Retail (H/F)\nLHH • Voiron • CDI"},
  {id:1651, job_title:'DAF Retail (H/F)', company:'LHH', location:'Voiron', contract_type:'CDI', alert_keyword:'DAF/Finance Director', raw_body:"Cadremploi alert — Isère search (Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR Responsable Budget et Reporting), CDI, >50000€\n\nDAF Retail (H/F)\nLHH • Voiron • CDI"},
  {id:1656, job_title:'DAF Retail (H/F)', company:'LHH', location:'Voiron', contract_type:'CDI', alert_keyword:'DAF/Finance Director', raw_body:"Cadremploi alert — Isère search (Directeur Financier OR DAF OR Finance Director OR Head of Finance OR Chef Comptable OR Responsable Budget et Reporting), CDI, >50000€\n\nDAF Retail (H/F)\nLHH • Voiron • CDI"},

  // Thread 19f8966b - Supply Chain (3 listings)
  {id:1627, job_title:'Responsable Supply Chain H/F', company:'NL CONSEIL RESSOURCES & STATEGIES', location:'Saint-Marcel', contract_type:'CDI', alert_keyword:'Supply Chain', raw_body:"Cadremploi alert — Isère search (Responsable Supply Chain OR Supply Chain Manager OR Demand Planner), CDI\n\nResponsable Supply Chain H/F\nNL CONSEIL RESSOURCES & STATEGIES • Saint-Marcel • CDI"},
  {id:1628, job_title:'Responsable Supply Chain H/F', company:'Talents ADV & Supply', location:'Le Creusot', contract_type:'CDI', alert_keyword:'Supply Chain', raw_body:"Cadremploi alert — Isère search (Responsable Supply Chain OR Supply Chain Manager OR Demand Planner), CDI\n\nResponsable Supply Chain H/F\nTalents ADV & Supply • Le Creusot • CDI"},
  {id:1629, job_title:'Responsable Supply Chain H/F', company:'SAPIANCE RH', location:'Tours', contract_type:'CDI', alert_keyword:'Supply Chain', raw_body:"Cadremploi alert — Isère search (Responsable Supply Chain OR Supply Chain Manager OR Demand Planner), CDI\n\nResponsable Supply Chain H/F\nSAPIANCE RH • Tours • CDI"},
  {id:1630, placeholder:true},

  // Thread 19f8e8b6 - Financial Controller alt (3 listings)
  {id:1632, job_title:'Accounting Manager H/F', company:'MICHAEL PAGE', location:'Noisy-le-Grand', contract_type:'CDI', alert_keyword:'Financial Controller/Cost Controller', raw_body:"Cadremploi alert — Isère search (Financial Controller OR Finance Manager OR Accounting Manager OR FP&A Manager OR Cost Controller OR P2P Manager OR Credit Manager OR Procurement Manager OR Finance Governance), CDI\n\nAccounting Manager H/F\nMICHAEL PAGE • Noisy-le-Grand • CDI"},
  {id:1633, job_title:'Cost Controller H/F', company:'PARLYM', location:'Cherbourg-Octeville', contract_type:'CDI', alert_keyword:'Financial Controller/Cost Controller', raw_body:"Cadremploi alert — Isère search (Financial Controller OR Finance Manager OR Accounting Manager OR FP&A Manager OR Cost Controller OR P2P Manager OR Credit Manager OR Procurement Manager OR Finance Governance), CDI\n\nCost Controller H/F\nPARLYM • Cherbourg-Octeville • CDI"},
  {id:1634, job_title:'Cost Controller H/F', company:'PARLYM', location:'Pierrelatte', contract_type:'CDI', alert_keyword:'Financial Controller/Cost Controller', raw_body:"Cadremploi alert — Isère search (Financial Controller OR Finance Manager OR Accounting Manager OR FP&A Manager OR Cost Controller OR P2P Manager OR Credit Manager OR Procurement Manager OR Finance Governance), CDI\n\nCost Controller H/F\nPARLYM • Pierrelatte • CDI"},
  {id:1635, placeholder:true},

  // Thread 19f93b11 - Supply Chain (3 listings)
  {id:1637, job_title:"Responsable Supply Chain & Production H/F", company:"Mercato de l'emploi", location:'Toulouse', contract_type:'CDI', alert_keyword:'Supply Chain', raw_body:"Cadremploi alert — Isère search (Responsable Supply Chain OR Supply Chain Manager OR Demand Planner), CDI\n\nResponsable Supply Chain & Production H/F\nMercato de l'emploi • Toulouse • CDI"},
  {id:1638, job_title:'Responsable Supply Chain H/F', company:'NL CONSEIL RESSOURCES & STATEGIES', location:'Saint-Marcel', contract_type:'CDI', alert_keyword:'Supply Chain', raw_body:"Cadremploi alert — Isère search (Responsable Supply Chain OR Supply Chain Manager OR Demand Planner), CDI\n\nResponsable Supply Chain H/F\nNL CONSEIL RESSOURCES & STATEGIES • Saint-Marcel • CDI"},
  {id:1639, job_title:'Responsable Supply Chain H/F', company:'Talents ADV & Supply', location:'Le Creusot', contract_type:'CDI', alert_keyword:'Supply Chain', raw_body:"Cadremploi alert — Isère search (Responsable Supply Chain OR Supply Chain Manager OR Demand Planner), CDI\n\nResponsable Supply Chain H/F\nTalents ADV & Supply • Le Creusot • CDI"},
  {id:1640, placeholder:true},

  // Thread 19f98d0a - Contrôleur de Gestion (3 listings)
  {id:1642, job_title:'Contrôleur de gestion industriel F/H', company:'IMPLID', location:'Saint-Priest', contract_type:'CDI', alert_keyword:'Contrôleur de Gestion', raw_body:"Cadremploi alert — Isère search (Contrôleur de Gestion OR Responsable Contrôle de Gestion OR Contrôleur de Gestion Industriel OR Finance Business Partner), CDI\n\nContrôleur de gestion industriel F/H\nIMPLID • Saint-Priest • CDI"},
  {id:1643, job_title:'CONTROLEUR DE GESTION INDUSTRIEL H/F', company:'ACP ATLANTIQUE', location:'Finistère', contract_type:'CDI', alert_keyword:'Contrôleur de Gestion', raw_body:"Cadremploi alert — Isère search (Contrôleur de Gestion OR Responsable Contrôle de Gestion OR Contrôleur de Gestion Industriel OR Finance Business Partner), CDI\n\nCONTROLEUR DE GESTION INDUSTRIEL H/F\nACP ATLANTIQUE • Finistère • CDI"},
  {id:1644, job_title:'Contrôleur de Gestion Industriel H/F', company:'SKILLS RH', location:'La Roche-sur-Yon', contract_type:'CDI', alert_keyword:'Contrôleur de Gestion', raw_body:"Cadremploi alert — Isère search (Contrôleur de Gestion OR Responsable Contrôle de Gestion OR Contrôleur de Gestion Industriel OR Finance Business Partner), CDI\n\nContrôleur de Gestion Industriel H/F\nSKILLS RH • La Roche-sur-Yon • CDI"},
  {id:1645, placeholder:true},

  // Thread 19f9df96 - Supply Chain (3 listings)
  {id:1647, job_title:'Responsable Supply Chain Site H/F', company:'Commerce', location:'Anzin', contract_type:'CDI', alert_keyword:'Supply Chain', raw_body:"Cadremploi alert — Isère search (Responsable Supply Chain OR Supply Chain Manager OR Demand Planner), CDI\n\nResponsable Supply Chain Site H/F\nCommerce • Anzin • CDI"},
  {id:1648, job_title:"Responsable Supply Chain & Production H/F", company:"Mercato de l'emploi", location:'Toulouse', contract_type:'CDI', alert_keyword:'Supply Chain', raw_body:"Cadremploi alert — Isère search (Responsable Supply Chain OR Supply Chain Manager OR Demand Planner), CDI\n\nResponsable Supply Chain & Production H/F\nMercato de l'emploi • Toulouse • CDI"},
  {id:1649, job_title:'Responsable Supply Chain H/F', company:'NL CONSEIL RESSOURCES & STATEGIES', location:'Saint-Marcel', contract_type:'CDI', alert_keyword:'Supply Chain', raw_body:"Cadremploi alert — Isère search (Responsable Supply Chain OR Supply Chain Manager OR Demand Planner), CDI\n\nResponsable Supply Chain H/F\nNL CONSEIL RESSOURCES & STATEGIES • Saint-Marcel • CDI"},
  {id:1650, placeholder:true},

  // Thread 19fa31cd - Financial Controller alt (3 listings)
  {id:1652, job_title:'Accounting Manager H/F', company:'MICHAEL PAGE', location:'Noisy-le-Grand', contract_type:'CDI', alert_keyword:'Financial Controller/Cost Controller', raw_body:"Cadremploi alert — Isère search (Financial Controller OR Finance Manager OR Accounting Manager OR FP&A Manager OR Cost Controller OR P2P Manager OR Credit Manager OR Procurement Manager OR Finance Governance), CDI\n\nAccounting Manager H/F\nMICHAEL PAGE • Noisy-le-Grand • CDI"},
  {id:1653, job_title:'Cost Controller H/F', company:'PARLYM', location:'Cherbourg-Octeville', contract_type:'CDI', alert_keyword:'Financial Controller/Cost Controller', raw_body:"Cadremploi alert — Isère search (Financial Controller OR Finance Manager OR Accounting Manager OR FP&A Manager OR Cost Controller OR P2P Manager OR Credit Manager OR Procurement Manager OR Finance Governance), CDI\n\nCost Controller H/F\nPARLYM • Cherbourg-Octeville • CDI"},
  {id:1654, job_title:'Cost Controller H/F', company:'PARLYM', location:'Pierrelatte', contract_type:'CDI', alert_keyword:'Financial Controller/Cost Controller', raw_body:"Cadremploi alert — Isère search (Financial Controller OR Finance Manager OR Accounting Manager OR FP&A Manager OR Cost Controller OR P2P Manager OR Credit Manager OR Procurement Manager OR Finance Governance), CDI\n\nCost Controller H/F\nPARLYM • Pierrelatte • CDI"},
  {id:1655, placeholder:true},

  // Thread 19fa843d - RAF/Comptabilité (3 listings)
  {id:1657, job_title:'Responsable comptabilité mandant F/H', company:'Ma Régie', location:'Villefranche-sur-Saone', contract_type:'CDI', alert_keyword:'RAF/Comptabilité', raw_body:"Cadremploi alert — Isère search (Responsable Administratif Financier OR RAF OR Responsable Financier OR Directeur Financier OR Responsable Comptabilité OR Chef Comptable), CDI\n\nResponsable comptabilité mandant F/H\nMa Régie • Villefranche-sur-Saone • CDI"},
  {id:1658, job_title:'Manager / Responsable comptabilité en CDI (H/F)', company:'MANPOWER FRANCE', location:'Angers', contract_type:'CDI', alert_keyword:'RAF/Comptabilité', raw_body:"Cadremploi alert — Isère search (Responsable Administratif Financier OR RAF OR Responsable Financier OR Directeur Financier OR Responsable Comptabilité OR Chef Comptable), CDI\n\nManager / Responsable comptabilité en CDI (H/F)\nMANPOWER FRANCE • Angers • CDI"},
  {id:1659, job_title:'RAF EGDC H/F', company:'SKILLS RH', location:'Nantes', contract_type:'CDI', alert_keyword:'RAF/Comptabilité', raw_body:"Cadremploi alert — Isère search (Responsable Administratif Financier OR RAF OR Responsable Financier OR Directeur Financier OR Responsable Comptabilité OR Chef Comptable), CDI\n\nRAF EGDC H/F\nSKILLS RH • Nantes • CDI"},
  {id:1660, placeholder:true},

  // HelloWork "Direct" source rows - headline listing per email
  {id:1661, job_title:'Responsable Comptable H/F', company:'Lynx RH', location:'Grenoble', contract_type:'CDI', salary:'45 000 - 55 000 € / an', alert_keyword:'Responsable Comptable', raw_body:"HelloWork alert (2 nouvelles offres) — headline match\n\nResponsable Comptable H/F\nLynx RH • Grenoble - 38 • CDI • 45 000 - 55 000 € / an\n\n(Also in digest: Responsable Comptable H/F, Tercio, Heyrieux-38, CDI, 48 000 €/an)"},
  {id:1662, job_title:'Responsable Pôle Comptable Frais Généraux H/F', company:'mc-conseil', location:'Vienne', contract_type:'CDI', alert_keyword:'Responsable Comptable', raw_body:"HelloWork alert (11 nouvelles offres) — headline match\n\nResponsable Pôle Comptable Frais Généraux H/F\nmc-conseil • Vienne - 38 • CDI"},
  {id:1663, job_title:'Directeur Administratif et Financier H/F', company:'Groupe GIF', location:'Échirolles', contract_type:'CDI', salary:'5 000 - 5 500 € / mois', alert_keyword:'Directeur Administratif et Financier', raw_body:"HelloWork alert (1 nouvelle offre) — headline match\n\nDirecteur Administratif et Financier H/F\nGroupe GIF • Échirolles - 38 • CDI • 5 000 - 5 500 € / mois"},
  {id:1664, job_title:'Responsable Comptable et Financier H/F', company:'LIP Tertiaire', location:'Meylan', contract_type:'CDI', salary:'80 000 € / an', alert_keyword:'Responsable Comptable et Financier', raw_body:"HelloWork alert (2 nouvelles offres) — headline match\n\nResponsable Comptable et Financier H/F\nLIP Tertiaire • Meylan - 38 • CDI • 80 000 € / an"},
  {id:1665, job_title:'Manager Comptable H/F', company:'BBM et Associés', location:'Montbonnot-Saint-Martin', contract_type:'CDI', alert_keyword:'Manager Comptable', raw_body:"HelloWork alert (8 nouvelles offres) — headline match\n\nManager Comptable H/F\nBBM et Associés • Montbonnot-Saint-Martin - 38 • CDI"},
  {id:1666, job_title:'Chef de Projet ERP H/F', company:'OPEN-PROD', location:'Échirolles', contract_type:'CDI', alert_keyword:'Chef de Projet ERP', raw_body:"HelloWork alert (7 nouvelles offres) — headline match\n\nChef de Projet ERP H/F\nOPEN-PROD • Échirolles - 38 • CDI\n\n(Digest also contained: DAF H/F, Adsearch, Voiron-38, CDI, 110 000-120 000 €/an — surfaced separately)"},
  {id:1667, job_title:'Responsable Pôle Comptable Frais Généraux H/F', company:'mc-conseil', location:'Vienne', contract_type:'CDI', alert_keyword:'Responsable Comptable', raw_body:"HelloWork alert (7 nouvelles offres) — headline match\n\nResponsable Pôle Comptable Frais Généraux H/F\nmc-conseil • Vienne - 38 • CDI"},
  {id:1668, job_title:'Gestionnaire de Flux Responsable des Flux H/F', company:'Work 2000 Chatte', location:'Saint-Marcellin', contract_type:'CDI', salary:'35 000 - 40 000 € / an', alert_keyword:'Gestionnaire de Flux', raw_body:"HelloWork alert (1 nouvelle offre) — headline match\n\nGestionnaire de Flux Responsable des Flux H/F\nWork 2000 Chatte • Saint-Marcellin - 38 • CDI • 35 000 - 40 000 € / an"},
  {id:1669, job_title:'Responsable Comptable H/F', company:'Lynx RH', location:'Grenoble', contract_type:'CDI', salary:'42 000 - 46 000 € / an', alert_keyword:'Responsable Comptable', raw_body:"HelloWork alert (14 nouvelles offres) — headline match\n\nResponsable Comptable H/F\nLynx RH • Grenoble - 38 • CDI • 42 000 - 46 000 € / an\n\n(Digest also contained: Responsable Comptable et Tresorerie H/F, Michael Page, Meylan-38, CDI, 65 000-85 000 €/an — appears already tracked in existing pipeline)"},
];

async function run() {
  await c.connect();
  let updated = 0, placeholders = 0;
  for (const u of updates) {
    if (u.placeholder) {
      await c.query(
        `UPDATE listing_inbox SET parse_status='processed', parse_notes='Placeholder row — only 3 listings found in this Cadremploi digest, no 4th listing. Chrome-extracted.' WHERE id=$1 AND user_profile=$2`,
        [u.id, USER_PROFILE]
      );
      placeholders++;
      continue;
    }
    await c.query(
      `UPDATE listing_inbox SET job_title=$1, company=$2, location=$3, contract_type=$4, salary=$5, alert_keyword=$6, raw_body=$7, job_url='Not available', english=false, parse_status='pending', parse_notes='Chrome-extracted — ready for Claude parse' WHERE id=$8 AND user_profile=$9`,
      [u.job_title, u.company, u.location, u.contract_type, u.salary || null, u.alert_keyword, u.raw_body, u.id, USER_PROFILE]
    );
    updated++;
  }

  // Surface buried standout listing found in the OPEN-PROD digest (row 1666's thread)
  const ins = await c.query(
    `INSERT INTO listing_inbox
     (parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword, job_title, company, location, salary, job_url, contract_type, parse_status, parse_notes, english, raw_body, user_profile)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING id`,
    ['2026-07-25', '19f9806d98e116a2', 'https://mail.google.com/mail/u/0/#all/19f9806d98e116a2', 'Direct', 'DAF',
     'DAF H/F', 'Adsearch', 'Voiron', '110 000 - 120 000 € / an', 'Not available', 'CDI',
     'pending', 'Buried listing surfaced from HelloWork digest embedded in Chef de Projet ERP alert (thread also produced row for headline listing) — Chrome-extracted', false,
     "HelloWork alert (7 nouvelles offres) — buried listing (not the headline)\n\nDAF H/F\nAdsearch • Voiron - 38 • CDI • 110 000 - 120 000 € / an",
     USER_PROFILE]
  );

  console.log(JSON.stringify({updated, placeholders, new_insert_id: ins.rows[0].id}));
  await c.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
