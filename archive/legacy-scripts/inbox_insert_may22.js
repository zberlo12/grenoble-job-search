'use strict';
const {Client} = require(process.env.PG_MODULE);
const CONN = process.env.PG_CONN;
const USER_PROFILE = 'zberlo';
const PARSE_DATE = '2026-05-22';
const TU = 'https://mail.google.com/mail/u/0/#all/';

const ALL_LISTINGS = [

  // === T1: 19e521827bf0e358 — Indeed ALTERNANCE Contrôle de gestion ===
  { tid:'19e521827bf0e358', src:'Indeed', ak:'ALTERNANCE Contrôle de gestion',
    title:'Alternance - Contrôleur de Gestion', co:'STMicroelectronics',
    loc:'Grenoble (38)', sal:null, url:'https://fr.indeed.com/viewjob?jk=f5322727193220',
    ct:'Alternance', ps:'pending', pn:null, en:true,
    rs:'STMicroelectronics — Grenoble (38) — Alternance Contrôleur de Gestion',
    rb:'Alerte Emploi Indeed | ALTERNANCE Contrôle de gestion - Grenoble (38)\nSTMicroelectronics - Grenoble (38)\nhttps://fr.indeed.com/viewjob?jk=f5322727193220' },

  // === T2: 19e5105187db4d96 — Indeed Pilote Financier morning (4 listings) ===
  { tid:'19e5105187db4d96', src:'Indeed', ak:'Pilote Financier',
    title:'Pilote Financier', co:'MAIRIE DE JARRIE',
    loc:'Jarrie (38)', sal:null, url:'https://fr.indeed.com/viewjob?jk=94e8ec395941dd',
    ct:null, ps:'pending', pn:null, en:false,
    rs:'MAIRIE DE JARRIE — Jarrie (38) — Pilote Financier',
    rb:'Alerte Emploi Indeed | Pilote Financier - Grenoble (38)\nMAIRIE DE JARRIE - Jarrie (38)\nhttps://fr.indeed.com/viewjob?jk=94e8ec395941dd' },
  { tid:'19e5105187db4d96', src:'Indeed', ak:'Pilote Financier',
    title:'Responsable Financier', co:'Société Dauphinoise',
    loc:'Isère (38)', sal:null, url:'Not available',
    ct:null, ps:'pending', pn:'pagead — verify title and location', en:false,
    rs:'Société Dauphinoise — Isère (38) — pagead',
    rb:'Alerte Emploi Indeed | Pilote Financier - Grenoble (38)\nSociété Dauphinoise — pagead — Isère (38)' },
  { tid:'19e5105187db4d96', src:'Indeed', ak:'Pilote Financier',
    title:'Pilote Financier', co:"CDIFLEX'",
    loc:'Grenoble (38)', sal:null, url:'Not available',
    ct:'CDI', ps:'pending', pn:'pagead — verify title and location', en:false,
    rs:"CDIFLEX' — Grenoble (38) — pagead",
    rb:"Alerte Emploi Indeed | Pilote Financier - Grenoble (38)\nCDIFLEX' — pagead — Grenoble (38)" },
  { tid:'19e5105187db4d96', src:'Indeed', ak:'Pilote Financier',
    title:'Responsable Financier', co:'Université Grenoble Alpes',
    loc:"Saint-Martin-d'Hères (38)", sal:null, url:'https://fr.indeed.com/viewjob?jk=4fa1d8c68b5bbc',
    ct:null, ps:'pending', pn:null, en:false,
    rs:"Université Grenoble Alpes — Saint-Martin-d'Hères (38)",
    rb:"Alerte Emploi Indeed | Pilote Financier - Grenoble (38)\nUniversité Grenoble Alpes - Saint-Martin-d'Hères (38)\nhttps://fr.indeed.com/viewjob?jk=4fa1d8c68b5bbc" },

  // === T3: 19e50fe8b48bc440 — Indeed finance director morning (7 listings) ===
  { tid:'19e50fe8b48bc440', src:'Indeed', ak:'finance director',
    title:'Directeur adjoint - Vivier Alpes F/H', co:'METRO France',
    loc:'Sassenage (38)', sal:null, url:'https://fr.indeed.com/viewjob?jk=38e1313dd647de',
    ct:null, ps:'pending', pn:null, en:true,
    rs:'METRO France — Sassenage (38) — Directeur adjoint - Vivier Alpes F/H',
    rb:'Alerte Emploi Indeed | 13 nouveaux emplois finance director - Grenoble (38)\n\nDirecteur adjoint - Vivier Alpes F/H\nMETRO France - Sassenage (38)\nM comme METRO France : Nous avons tous un rôle à jouer dans le développement de notre entreprise.\nhttps://fr.indeed.com/viewjob?jk=38e1313dd647de' },
  { tid:'19e50fe8b48bc440', src:'Indeed', ak:'finance director',
    title:'Directeur(rice) Etablissement de la SIEGL (H/F)', co:'Hermès Paris',
    loc:'Le Grand-Lemps (38)', sal:null, url:'https://fr.indeed.com/viewjob?jk=d1cada92a9d81f',
    ct:'CDI', ps:'pending', pn:null, en:true,
    rs:'Hermès Paris — Le Grand-Lemps (38) — CDI — Directeur Etablissement SIEGL',
    rb:'Alerte Emploi Indeed | 13 nouveaux emplois finance director - Grenoble (38)\n\nCDI - Directeur(rice) Etablissement de la SIEGL - (H/F)\nHermès Paris - Le Grand-Lemps (38)\nhttps://fr.indeed.com/viewjob?jk=d1cada92a9d81f' },
  { tid:'19e50fe8b48bc440', src:'Indeed', ak:'finance director',
    title:'Directeur de la Restauration et Cuisine centrale H/F', co:'Fondation Georges BOISSEL',
    loc:'Saint-Clair-de-la-Tour (38)', sal:null, url:'https://fr.indeed.com/viewjob?jk=43b1bb8f77a7ed',
    ct:null, ps:'pending', pn:null, en:false,
    rs:'Fondation Georges BOISSEL — Saint-Clair-de-la-Tour (38) — Directeur Restauration',
    rb:'Alerte Emploi Indeed | 13 nouveaux emplois finance director - Grenoble (38)\n\nDirecteur de la Restauration et Cuisine centrale H/F\nFondation Georges BOISSEL - Saint-Clair-de-la-Tour (38)\nhttps://fr.indeed.com/viewjob?jk=43b1bb8f77a7ed' },
  { tid:'19e50fe8b48bc440', src:'Indeed', ak:'finance director',
    title:'Contrôleur de Gestion Groupe (H/F)', co:"CDIFLEX'",
    loc:'Pontcharra (38)', sal:'35 000 € - 40 000 € par an', url:'Not available',
    ct:'CDI', ps:'pending', pn:null, en:false,
    rs:"CDIFLEX' — Pontcharra (38) — Contrôleur de Gestion Groupe — 35k-40k — CDI",
    rb:"Alerte Emploi Indeed | 13 nouveaux emplois finance director - Grenoble (38)\n\nCONTROLEUR DE GESTION GROUPE (H/F)\nCDIFLEX' - Pontcharra (38)\n35 000 € - 40 000 € par an\nCandidature simplifiée\nhttps://fr.indeed.com/pagead/..." },
  { tid:'19e50fe8b48bc440', src:'Indeed', ak:'finance director',
    title:'Directeur adjoint délégué formation (f/h)', co:'Université Grenoble Alpes',
    loc:"Saint-Martin-d'Hères (38)", sal:'2 289 € par mois', url:'https://fr.indeed.com/viewjob?jk=194560ec1dc9f5',
    ct:'CDD', ps:'pending', pn:null, en:false,
    rs:"Université Grenoble Alpes — Saint-Martin-d'Hères (38) — Directeur adjoint délégué formation — 2289€/mois",
    rb:"Alerte Emploi Indeed | 13 nouveaux emplois finance director - Grenoble (38)\n\nDirecteur adjoint délégué formation (f/h)\nUniversité Grenoble Alpes - Saint-Martin-d'Hères (38)\n2 289 € par mois\nhttps://fr.indeed.com/viewjob?jk=194560ec1dc9f5" },
  { tid:'19e50fe8b48bc440', src:'Indeed', ak:'finance director',
    title:"Directeur d'agence d'intérim et de recrutement indépendant H/F", co:'Lynx RH',
    loc:'Chambéry (73)', sal:null, url:'Not available',
    ct:null, ps:'pending', pn:null, en:false,
    rs:"Lynx RH — Chambéry (73) — Directeur d'agence d'intérim — pagead",
    rb:"Alerte Emploi Indeed | 13 nouveaux emplois finance director - Grenoble (38)\n\nDirecteur d'agence d'intérim et de recrutement indépendant H/F\nLynx RH - Chambéry (73)\nhttps://fr.indeed.com/pagead/..." },
  { tid:'19e50fe8b48bc440', src:'Indeed', ak:'finance director',
    title:"Directeur d'agence H/F", co:'VITALIS MEDICAL',
    loc:'Grenoble (38)', sal:null, url:'Not available',
    ct:null, ps:'pending', pn:null, en:false,
    rs:"VITALIS MEDICAL — Grenoble (38) — Directeur d'agence H/F — pagead",
    rb:"Alerte Emploi Indeed | 13 nouveaux emplois finance director - Grenoble (38)\n\nDirecteur d'agence H/F\nVITALIS MEDICAL - Grenoble (38)\nhttps://fr.indeed.com/pagead/..." },

  // === T4: 19e50d0e11fc1cac — LinkedIn "Jobs similar to Crédit manager" (10 listings) ===
  { tid:'19e50d0e11fc1cac', src:'LinkedIn', ak:'Crédit manager',
    title:'Retail Credit Risk Manager', co:'Revolut',
    loc:'France', sal:null, url:'https://www.linkedin.com/jobs/view/4399683230/',
    ct:null, ps:'pending', pn:null, en:true,
    rs:'Revolut — France — Retail Credit Risk Manager',
    rb:'Jobs similar to Crédit manager at Actual Talent\n\nRetail Credit Risk Manager\nRevolut\nFrance\nhttps://www.linkedin.com/jobs/view/4399683230/' },
  { tid:'19e50d0e11fc1cac', src:'LinkedIn', ak:'Crédit manager',
    title:'Credit Manager (F/H)', co:'ARNAL RESOTAINER',
    loc:'Sète', sal:null, url:'https://www.linkedin.com/jobs/view/4319430249/',
    ct:null, ps:'pending', pn:null, en:false,
    rs:'ARNAL RESOTAINER — Sète — Credit Manager (F/H)',
    rb:'Jobs similar to Crédit manager\n\nCredit Manager (F/H)\nARNAL RESOTAINER\nSète\nhttps://www.linkedin.com/jobs/view/4319430249/' },
  { tid:'19e50d0e11fc1cac', src:'LinkedIn', ak:'Crédit manager',
    title:'Credit Manager', co:'ANINE BING',
    loc:'Paris', sal:null, url:'https://www.linkedin.com/jobs/view/4373055311/',
    ct:null, ps:'pending', pn:null, en:true,
    rs:'ANINE BING — Paris — Credit Manager',
    rb:'Jobs similar to Crédit manager\n\nCredit Manager\nANINE BING\nParis\nhttps://www.linkedin.com/jobs/view/4373055311/' },
  { tid:'19e50d0e11fc1cac', src:'LinkedIn', ak:'Crédit manager',
    title:'CREDIT MANAGER GROUPE H/F', co:'HC RESOURCES',
    loc:'Greater Lyon Area', sal:null, url:'https://www.linkedin.com/jobs/view/4414150006/',
    ct:null, ps:'pending', pn:null, en:false,
    rs:'HC RESOURCES — Greater Lyon Area — CREDIT MANAGER GROUPE H/F',
    rb:'Jobs similar to Crédit manager\n\nCREDIT MANAGER GROUPE H/F\nHC RESOURCES\nGreater Lyon Area\nhttps://www.linkedin.com/jobs/view/4414150006/' },
  { tid:'19e50d0e11fc1cac', src:'LinkedIn', ak:'Crédit manager',
    title:'Credit manager', co:'First Education Online',
    loc:'Paris 8e', sal:null, url:'https://www.linkedin.com/jobs/view/4326724779/',
    ct:null, ps:'pending', pn:null, en:true,
    rs:'First Education Online — Paris 8e — Credit manager',
    rb:'Jobs similar to Crédit manager\n\nCredit manager\nFirst Education Online - US\n75008\nhttps://www.linkedin.com/jobs/view/4326724779/' },
  { tid:'19e50d0e11fc1cac', src:'LinkedIn', ak:'Crédit manager',
    title:'Crédit Manager EMEAI (F/H)', co:'Dassault Systèmes',
    loc:'Vélizy-Villacoublay', sal:null, url:'https://www.linkedin.com/jobs/view/4402167347/',
    ct:null, ps:'pending', pn:null, en:true,
    rs:'Dassault Systèmes — Vélizy-Villacoublay — Crédit Manager EMEAI',
    rb:'Jobs similar to Crédit manager\n\nCrédit Manager EMEAI (F/H)\nDassault Systèmes\nVélizy-Villacoublay\nhttps://www.linkedin.com/jobs/view/4402167347/' },
  { tid:'19e50d0e11fc1cac', src:'LinkedIn', ak:'Crédit manager',
    title:'Credit Manager (F/H)', co:'Hilti France',
    loc:'Boulogne-Billancourt', sal:null, url:'https://www.linkedin.com/jobs/view/4371995200/',
    ct:null, ps:'pending', pn:null, en:false,
    rs:'Hilti France — Boulogne-Billancourt — Credit Manager (F/H)',
    rb:'Jobs similar to Crédit manager\n\nCredit Manager (F/H)\nHilti France\nBoulogne-Billancourt\nhttps://www.linkedin.com/jobs/view/4371995200/' },
  { tid:'19e50d0e11fc1cac', src:'LinkedIn', ak:'Crédit manager',
    title:'Credit Manager Group', co:'L-Acoustics',
    loc:'Massy', sal:null, url:'https://www.linkedin.com/jobs/view/4397325188/',
    ct:null, ps:'pending', pn:null, en:true,
    rs:'L-Acoustics — Massy — Credit Manager Group',
    rb:'Jobs similar to Crédit manager\n\nCredit Manager Group\nL-Acoustics\nMassy\nhttps://www.linkedin.com/jobs/view/4397325188/' },
  { tid:'19e50d0e11fc1cac', src:'LinkedIn', ak:'Crédit manager',
    title:'Credit Risk Manager F/M', co:'Candriam',
    loc:'Paris', sal:null, url:'https://www.linkedin.com/jobs/view/4388171026/',
    ct:null, ps:'pending', pn:null, en:true,
    rs:'Candriam — Paris — Credit Risk Manager F/M',
    rb:'Jobs similar to Crédit manager\n\nCredit Risk Manager F/M\nCandriam\nParis\nhttps://www.linkedin.com/jobs/view/4388171026/' },
  { tid:'19e50d0e11fc1cac', src:'LinkedIn', ak:'Crédit manager',
    title:'Credit Manager H/F', co:"L'Usine Nouvelle",
    loc:'Épouville', sal:null, url:'https://www.linkedin.com/jobs/view/4412457358/',
    ct:null, ps:'pending', pn:null, en:false,
    rs:"L'Usine Nouvelle — Épouville — Credit Manager H/F",
    rb:"Jobs similar to Crédit manager\n\nCredit Manager H/F\nL'Usine Nouvelle\nÉpouville\nhttps://www.linkedin.com/jobs/view/4412457358/" },

  // === T5: 19e506318d9a2ed5 — LinkedIn Contrôleur de Gestion / Finance BP alert ===
  { tid:'19e506318d9a2ed5', src:'LinkedIn', ak:'Contrôleur de Gestion',
    title:'Contrôleur de gestion - F/H', co:'Forum réfugiés',
    loc:'France', sal:null, url:'https://www.linkedin.com/jobs/view/4416589054/',
    ct:null, ps:'pending', pn:null, en:false,
    rs:'Forum réfugiés — France — Contrôleur de gestion - F/H',
    rb:'Your job alert for Contrôleur de Gestion OR Finance Business Partner in Grenoble\nContrôleur de gestion - F/H\nForum réfugiés\nFrance\nhttps://www.linkedin.com/jobs/view/4416589054/' },

  // === T6: 19e5014d72adb514 — Cadremploi HTML-only (2 rows) ===
  { tid:'19e5014d72adb514', src:'Cadremploi', ak:'Credit Manager',
    title:'Credit Manager', co:'Not disclosed',
    loc:'Not disclosed', sal:null, url:'Not available',
    ct:null, ps:'manual_check', pn:'Cadremploi HTML-only — open Gmail link to review and paste JD', en:false,
    rs:'Cadremploi — Credit Manager — HTML-only alert',
    rb:'SUBJECT: Votre profil intéresse ces entreprises ! | SNIPPET: Ces entreprises recherchent encore des candidats ! Credit Manager OR Responsable Recouvrement OR Responsable Trésorerie OR Trésorier' },
  { tid:'19e5014d72adb514', src:'Cadremploi', ak:'Responsable Achats',
    title:'Responsable Achats', co:'Not disclosed',
    loc:'Not disclosed', sal:null, url:'Not available',
    ct:null, ps:'manual_check', pn:'Cadremploi HTML-only — open Gmail link to review and paste JD', en:false,
    rs:'Cadremploi — Responsable Achats — HTML-only alert',
    rb:'SUBJECT: Votre profil intéresse ces entreprises ! | SNIPPET: Responsable Achats OR Acheteur Senior OR Responsable Procure-to-Pay OR Responsable Supply' },

  // === T8: 19e4fa0174bce4f0 — HelloWork HTML-only (subject-parsed) ===
  { tid:'19e4fa0174bce4f0', src:'Direct', ak:'Controleur de Gestion',
    title:'Controleur de Gestion - Comptable', co:'Not disclosed',
    loc:'Not disclosed', sal:null, url:'Not available',
    ct:null, ps:'manual_check', pn:'HelloWork HTML-only — open Gmail link to review and paste JD', en:false,
    rs:'HelloWork — Controleur de Gestion - Comptable H/F — HTML-only',
    rb:'SUBJECT: Controleur de Gestion - Comptable H/F | HelloWork direct alert — HTML-only body, no plaintext available' },

  // === T9: 19e4f8755552a3b0 — LinkedIn RAF/DAF + Financial Controller alerts (2 inserts + 1 url_dedup) ===
  { tid:'19e4f8755552a3b0', src:'LinkedIn', ak:'Responsable Administratif Financier',
    title:'Operations Manager (Payments)', co:'Revolut',
    loc:'France', sal:null, url:'https://www.linkedin.com/jobs/view/4321549280/',
    ct:null, ps:'pending', pn:null, en:true,
    rs:'Revolut — France — Operations Manager (Payments)',
    rb:'Your job alert for Responsable Administratif Financier OR RAF OR Directeur Financier in Grenoble\nOperations Manager (Payments)\nRevolut\nFrance\nhttps://www.linkedin.com/jobs/view/4321549280/' },
  { tid:'19e4f8755552a3b0', src:'LinkedIn', ak:'Responsable Administratif Financier',
    title:'Director of Green (Sustainable) Finance (m/f/x)', co:'HiTHIUM Energy Storage',
    loc:'European Economic Area', sal:null, url:'https://www.linkedin.com/jobs/view/4417462899/',
    ct:null, ps:'pending', pn:null, en:true,
    rs:'HiTHIUM Energy Storage — EEA — Director of Green (Sustainable) Finance',
    rb:'Your job alert for Responsable Administratif Financier OR RAF in Grenoble\nDirector of Green (Sustainable) Finance (m/f/x)\nHiTHIUM Energy Storage\nEuropean Economic Area\nhttps://www.linkedin.com/jobs/view/4417462899/' },
  { tid:'19e4f8755552a3b0', src:'LinkedIn', ak:'Financial Controller',
    title:'Operations Manager (Payments)', co:'Revolut',
    loc:'France', sal:null, url:'https://www.linkedin.com/jobs/view/4321549280/',
    ct:null, ps:'pending', pn:null, en:true,
    rs:'Revolut — France — Operations Manager (Payments) — second alert',
    rb:'Your job alert for Financial Controller OR Finance Manager in Grenoble\nOperations Manager (Payments)\nRevolut\nFrance\nhttps://www.linkedin.com/jobs/view/4321549280/',
    urlDedup: true },

  // === T10: 19e4f3c360f3c2f3 — Cadremploi HTML-only Supply Chain Manager ===
  { tid:'19e4f3c360f3c2f3', src:'Cadremploi', ak:'Supply Chain Manager',
    title:'Supply Chain Manager', co:'Not disclosed',
    loc:'Isère', sal:null, url:'Not available',
    ct:'CDI', ps:'manual_check', pn:'Cadremploi HTML-only — open Gmail link to review and paste JD', en:false,
    rs:'Cadremploi — Supply Chain Manager — Isère — CDI — HTML-only',
    rb:'SUBJECT: 1 nouvelle offre a été publiée ce matin | SNIPPET: Responsable Supply Chain OR Supply Chain Manager OR Demand Planner, Isère, CDI — Supply Chain Manager France' },

  // === T11: 19e4f3a6797f7a2f — Cadremploi "Et si vous modifiez vos critères" (3 rows) ===
  { tid:'19e4f3a6797f7a2f', src:'Cadremploi', ak:'Credit Manager',
    title:'Credit Manager', co:'Not disclosed',
    loc:'Not disclosed', sal:null, url:'Not available',
    ct:null, ps:'manual_check', pn:'Cadremploi HTML-only — open Gmail link to review and paste JD', en:false,
    rs:'Cadremploi — Et si vous modifiez vos critères — Credit Manager',
    rb:'SUBJECT: Et si vous modifiez vos critères de recherche ? | SNIPPET: 3 offres d\'emploi trouvées — Credit Manager OR Responsable Recouvrement' },
  { tid:'19e4f3a6797f7a2f', src:'Cadremploi', ak:'Financial Controller',
    title:'Financial Controller', co:'Not disclosed',
    loc:'Not disclosed', sal:null, url:'Not available',
    ct:null, ps:'manual_check', pn:'Cadremploi HTML-only — open Gmail link to review and paste JD', en:false,
    rs:'Cadremploi — Et si vous modifiez vos critères — Financial Controller',
    rb:'SUBJECT: Et si vous modifiez vos critères de recherche ? | SNIPPET: 3 offres d\'emploi trouvées — Financial Controller OR Finance Manager OR Accounting' },
  { tid:'19e4f3a6797f7a2f', src:'Cadremploi', ak:'Responsable Achats',
    title:'Responsable Achats', co:'Not disclosed',
    loc:'Not disclosed', sal:null, url:'Not available',
    ct:null, ps:'manual_check', pn:'Cadremploi HTML-only — open Gmail link to review and paste JD', en:false,
    rs:'Cadremploi — Et si vous modifiez vos critères — Responsable Achats',
    rb:'SUBJECT: Et si vous modifiez vos critères de recherche ? | SNIPPET: 3 offres trouvées — Responsable Achats OR Acheteur Senior OR Responsable' },

  // === T12: 19e4f1974aa04532 — LinkedIn Hermès Alternant CDG ===
  { tid:'19e4f1974aa04532', src:'LinkedIn', ak:'Contrôleur de Gestion',
    title:'Alternant contrôleur de gestion', co:'Hermès',
    loc:'Les Abrets en Dauphiné', sal:null, url:'https://www.linkedin.com/jobs/view/4367813663/',
    ct:'Alternance', ps:'pending', pn:null, en:false,
    rs:'Hermès — Les Abrets en Dauphiné — Alternant contrôleur de gestion',
    rb:'Your job alert for Contrôleur de Gestion OR Pilote Financier OR Finance Business Partner in Greater Grenoble\n1 new job matches your preferences.\n\nAlternant contrôleur de gestion\nHermès\nLes Abrets en Dauphiné\nhttps://www.linkedin.com/jobs/view/4367813663/' },

  // === T13: 19e4eab9757c7f17 — LinkedIn operational/supply chain alert (3 listings) ===
  { tid:'19e4eab9757c7f17', src:'LinkedIn', ak:'Senior Manager Operations',
    title:'Senior Manager Operations', co:'METYCLE',
    loc:'France', sal:null, url:'https://www.linkedin.com/jobs/view/4414020339/',
    ct:null, ps:'pending', pn:null, en:true,
    rs:'METYCLE — France — Senior Manager Operations',
    rb:'LinkedIn job alert\nSenior Manager Operations\nMETYCLE\nFrance\nhttps://www.linkedin.com/jobs/view/4414020339/' },
  { tid:'19e4eab9757c7f17', src:'LinkedIn', ak:'Senior Manager Operations',
    title:'Distribution Channel Manager', co:'BD',
    loc:'Grenoble (38)', sal:null, url:'https://www.linkedin.com/jobs/view/4417775337/',
    ct:null, ps:'pending', pn:null, en:true,
    rs:'BD — Grenoble (38) — Distribution Channel Manager',
    rb:'LinkedIn job alert\nDistribution Channel Manager\nBD\nGrenoble\nhttps://www.linkedin.com/jobs/view/4417775337/' },
  { tid:'19e4eab9757c7f17', src:'LinkedIn', ak:'Senior Manager Operations',
    title:'Responsable Activités', co:'Linde Material Handling',
    loc:'France', sal:null, url:'https://www.linkedin.com/jobs/view/4375779351/',
    ct:null, ps:'pending', pn:null, en:false,
    rs:'Linde Material Handling — France — Responsable Activités',
    rb:'LinkedIn job alert\nResponsable Activités\nLinde Material Handling\nFrance\nhttps://www.linkedin.com/jobs/view/4375779351/' },

  // === T14: 19e4e7c11da88891 — APEC 12 offres du 22/05/2026 ===
  { tid:'19e4e7c11da88891', src:'APEC', ak:'Finance',
    title:'Not disclosed', co:'Not disclosed',
    loc:'Not disclosed', sal:null, url:'Not available',
    ct:null, ps:'manual_check', pn:'APEC: 12 offres — Finance — HTML-only — check apec.fr manually', en:false,
    rs:'APEC — 12 offres Apec du 22/05/2026',
    rb:'SUBJECT: 12 offres Apec du 22/05/2026 | SNIPPET: Retrouvez les offres correspondant à vos alertes emploi' },

  // === T15: 19e4e2b38270de0e — HelloWork Comptable Général H/F (subject-parsed) ===
  { tid:'19e4e2b38270de0e', src:'Direct', ak:'Comptable',
    title:'Comptable Général', co:'ASTRA X RH',
    loc:'Not disclosed', sal:null, url:'Not available',
    ct:null, ps:'manual_check', pn:'HelloWork HTML-only — open Gmail link to review and paste JD', en:false,
    rs:'ASTRA X RH — Comptable Général H/F — HelloWork — HTML-only',
    rb:'SUBJECT: Comptable Général H/F | ASTRA X RH | HelloWork direct alert — HTML-only body, no plaintext available' },

  // === T16: 19e4d13843a2307a — Indeed Pilote Financier midnight (1 new + 2 url_dedup) ===
  { tid:'19e4d13843a2307a', src:'Indeed', ak:'Pilote Financier',
    title:'Responsable Financier', co:'Société Dauphinoise',
    loc:'Isère (38)', sal:null, url:'Not available',
    ct:null, ps:'pending', pn:'pagead — verify title and location', en:false,
    rs:'Société Dauphinoise — Isère (38) — pagead — midnight alert',
    rb:'Alerte Emploi Indeed | Pilote Financier - Grenoble (38)\nSociété Dauphinoise — pagead — Isère (38) | midnight alert' },
  { tid:'19e4d13843a2307a', src:'Indeed', ak:'Pilote Financier',
    title:'Pilote Financier', co:'MAIRIE DE JARRIE',
    loc:'Jarrie (38)', sal:null, url:'https://fr.indeed.com/viewjob?jk=94e8ec395941dd',
    ct:null, ps:'pending', pn:null, en:false,
    rs:'MAIRIE DE JARRIE — Jarrie (38) — midnight alert',
    rb:'MAIRIE DE JARRIE - Jarrie (38) | jk=94e8ec395941dd | Pilote Financier midnight alert',
    urlDedup: true },
  { tid:'19e4d13843a2307a', src:'Indeed', ak:'Pilote Financier',
    title:'Responsable Financier', co:'Université Grenoble Alpes',
    loc:"Saint-Martin-d'Hères (38)", sal:null, url:'https://fr.indeed.com/viewjob?jk=4fa1d8c68b5bbc',
    ct:null, ps:'pending', pn:null, en:false,
    rs:"Université Grenoble Alpes — midnight alert",
    rb:"Université Grenoble Alpes - Saint-Martin-d'Hères (38) | jk=4fa1d8c68b5bbc | Pilote Financier midnight",
    urlDedup: true },

  // === T17: 19e4d0e2f4f5f4b3 — Indeed finance director midnight (5 new + 3 url_dedup) ===
  { tid:'19e4d0e2f4f5f4b3', src:'Indeed', ak:'finance director',
    title:'Directeur Hypermarché F/H', co:'Groupe Provencia',
    loc:'Voiron (38)', sal:'6 000 € - 7 500 € par mois', url:'https://fr.indeed.com/viewjob?jk=7406ee5ab6b069',
    ct:null, ps:'pending', pn:null, en:false,
    rs:'Groupe Provencia — Voiron (38) — Directeur Hypermarché — 6000-7500€/mois',
    rb:'Alerte Emploi Indeed | 13 nouveaux emplois finance director - Grenoble (38)\n\nDIRECTEUR HYPERMARCHé F/H\nGroupe Provencia - Voiron (38)\n6 000 € - 7 500 € par mois\nhttps://fr.indeed.com/viewjob?jk=7406ee5ab6b069' },
  { tid:'19e4d0e2f4f5f4b3', src:'Indeed', ak:'finance director',
    title:'Directeur(rice) Etablissement de la SIEGL (H/F)', co:'Hermès Paris',
    loc:'Le Grand-Lemps (38)', sal:null, url:'https://fr.indeed.com/viewjob?jk=d1cada92a9d81f',
    ct:'CDI', ps:'pending', pn:null, en:true,
    rs:'Hermès Paris — Le Grand-Lemps — CDI — midnight',
    rb:'Hermès Paris - Le Grand-Lemps (38) | jk=d1cada92a9d81f | finance director midnight',
    urlDedup: true },
  { tid:'19e4d0e2f4f5f4b3', src:'Indeed', ak:'finance director',
    title:'Directeur de la Restauration et Cuisine centrale H/F', co:'Fondation Georges BOISSEL',
    loc:'Saint-Clair-de-la-Tour (38)', sal:null, url:'https://fr.indeed.com/viewjob?jk=43b1bb8f77a7ed',
    ct:null, ps:'pending', pn:null, en:false,
    rs:'Fondation BOISSEL — midnight',
    rb:'Fondation Georges BOISSEL - Saint-Clair-de-la-Tour (38) | jk=43b1bb8f77a7ed | midnight',
    urlDedup: true },
  { tid:'19e4d0e2f4f5f4b3', src:'Indeed', ak:'finance director',
    title:'Directeur adjoint délégué formation (f/h)', co:'Université Grenoble Alpes',
    loc:"Saint-Martin-d'Hères (38)", sal:'2 289 € par mois', url:'https://fr.indeed.com/viewjob?jk=194560ec1dc9f5',
    ct:'CDD', ps:'pending', pn:null, en:false,
    rs:"Université Grenoble Alpes — midnight",
    rb:"Université Grenoble Alpes - Saint-Martin-d'Hères (38) | jk=194560ec1dc9f5 | midnight",
    urlDedup: true },
  { tid:'19e4d0e2f4f5f4b3', src:'Indeed', ak:'finance director',
    title:"Directeur d'agence d'intérim et de recrutement indépendant H/F", co:'Lynx RH',
    loc:'Chambéry (73)', sal:null, url:'Not available',
    ct:null, ps:'pending', pn:null, en:false,
    rs:"Lynx RH — Chambéry (73) — pagead — midnight",
    rb:"Directeur d'agence d'intérim H/F\nLynx RH - Chambéry (73)\nhttps://fr.indeed.com/pagead/... | midnight alert" },
  { tid:'19e4d0e2f4f5f4b3', src:'Indeed', ak:'finance director',
    title:"Directeur d'agence H/F", co:'VITALIS MEDICAL',
    loc:'Grenoble (38)', sal:null, url:'Not available',
    ct:null, ps:'pending', pn:null, en:false,
    rs:"VITALIS MEDICAL — Grenoble (38) — pagead — midnight",
    rb:"Directeur d'agence H/F\nVITALIS MEDICAL - Grenoble (38)\nhttps://fr.indeed.com/pagead/... | midnight alert" },
  { tid:'19e4d0e2f4f5f4b3', src:'Indeed', ak:'finance director',
    title:"Directeur d'agence H/F", co:'VITALIS MEDICAL',
    loc:'Voiron (38)', sal:null, url:'Not available',
    ct:null, ps:'pending', pn:null, en:false,
    rs:"VITALIS MEDICAL — Voiron (38) — pagead — midnight",
    rb:"Directeur d'agence H/F\nVITALIS MEDICAL - Voiron (38)\nhttps://fr.indeed.com/pagead/... | midnight alert" },
  { tid:'19e4d0e2f4f5f4b3', src:'Indeed', ak:'finance director',
    title:"Directeur d'agence H/F", co:'VITALIS MEDICAL',
    loc:'Tullins (38)', sal:null, url:'Not available',
    ct:null, ps:'pending', pn:null, en:false,
    rs:"VITALIS MEDICAL — Tullins (38) — pagead — midnight",
    rb:"Directeur d'agence H/F\nVITALIS MEDICAL - Tullins (38)\nhttps://fr.indeed.com/pagead/... | midnight alert" },
];

async function run() {
  const c = new Client({connectionString: CONN});
  await c.connect();

  const existingUrls = new Set();
  let inserted = 0, urlDeduped = 0, errors = [];

  // Batch URL check against DB (last 7 days, same user)
  const realUrls = ALL_LISTINGS
    .filter(l => l.url && l.url !== 'Not available')
    .map(l => l.url);
  const uniqueUrls = [...new Set(realUrls)];

  if (uniqueUrls.length > 0) {
    const dbDedupRes = await c.query(
      'SELECT job_url FROM listing_inbox WHERE job_url = ANY($1) AND parse_date >= CURRENT_DATE - 7 AND user_profile = $2',
      [uniqueUrls, USER_PROFILE]
    );
    for (const row of dbDedupRes.rows) existingUrls.add(row.job_url);
  }

  for (const l of ALL_LISTINGS) {
    // Skip hard-coded url_dedup markers (intra-batch or pre-marked)
    if (l.urlDedup) { urlDeduped++; continue; }

    // URL dedup against DB results
    if (l.url && l.url !== 'Not available' && existingUrls.has(l.url)) {
      urlDeduped++;
      continue;
    }

    // Track for intra-batch dedup
    if (l.url && l.url !== 'Not available') existingUrls.add(l.url);

    try {
      await c.query(
        `INSERT INTO listing_inbox
         (parse_date, gmail_thread_id, gmail_thread_url, source, alert_keyword,
          job_title, company, location, salary, job_url, contract_type,
          parse_status, parse_notes, english, raw_snippet, raw_body, user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          PARSE_DATE,
          l.tid,
          TU + l.tid,
          l.src,
          l.ak,
          l.title,
          l.co,
          l.loc,
          l.sal,
          l.url,
          l.ct,
          l.ps,
          l.pn,
          l.en,
          l.rs ? l.rs.substring(0, 200) : null,
          l.rb ? l.rb.substring(0, 8000) : null,
          USER_PROFILE
        ]
      );
      inserted++;
    } catch (e) {
      errors.push(`${l.co} / ${l.tid}: ${e.message}`);
    }
  }

  await c.end();

  const pending = ALL_LISTINGS.filter(l => !l.urlDedup && l.ps === 'pending').length
    - ALL_LISTINGS.filter(l => !l.urlDedup && l.ps === 'pending' && l.url !== 'Not available' && existingUrls.has(l.url)).length;
  const manual = ALL_LISTINGS.filter(l => !l.urlDedup && l.ps === 'manual_check').length;

  console.log(`inserted=${inserted} url_dedup=${urlDeduped} errors=${errors.length}`);
  if (errors.length) errors.forEach(e => console.error('ERROR:', e));
}

run().catch(e => { console.error(e.message); process.exit(1); });
