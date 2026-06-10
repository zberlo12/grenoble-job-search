const { Client } = require(process.env.PG_MODULE);
const c = new Client({ connectionString: process.env.PG_CONN });

async function run() {
  await c.connect();

  // Mark duplicates processed
  const dupIds = [926, 927, 937, 943, 947, 948, 949, 950, 955, 959, 965];
  await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=ANY($1) AND user_profile='zberlo'", [dupIds]);
  console.log('DUPS_MARKED:' + dupIds.length);

  // Dismissed rows → job_applications
  const dismissed = [
    {id:928,title:"Responsable administratif H/F",company:"Maison de l'Emploi et de l'Entreprise-MIFE Isère",src:"Indeed",loc:"Eybens (38)",sal:"15.67 EUR/hr",url:"Not available",gurl:"https://mail.google.com/mail/u/0/#all/19ea36dd7ccfa33e",kw:"finance director",dt:"2026-06-06",rf:["Low salary","Junior scope"],en:false,note:"Auto-dismissed: salary below floor (€15.67/hr ≈ €32K/yr), junior admin scope"},
    {id:929,title:"Directeur CER H/F",company:"Sauvegarde Isère",src:"Indeed",loc:"Lans-en-Vercors (38)",sal:"50016",url:"Not available",gurl:"https://mail.google.com/mail/u/0/#all/19ea36dd7ccfa33e",kw:"finance director",dt:"2026-06-06",rf:["Off-topic"],en:false,note:"Auto-dismissed: Off-topic — social/educational facility director (CER)"},
    {id:930,title:"Directeur Commercial Adjoint H/F",company:"CBA Assurance",src:"Indeed",loc:"Échirolles (38)",sal:"41000-42000",url:"Not available",gurl:"https://mail.google.com/mail/u/0/#all/19ea36dd7ccfa33e",kw:"finance director",dt:"2026-06-06",rf:["Off-topic","Low salary"],en:false,note:"Auto-dismissed: Off-topic — commercial/sales director; salary below floor"},
    {id:931,title:"Directeur / Directrice de crèche EJE en CDI H/F",company:"Zanaka Solutions RH",src:"Indeed",loc:"Eybens (38)",sal:"30000",url:"Not available",gurl:"https://mail.google.com/mail/u/0/#all/19ea36dd7ccfa33e",kw:"finance director",dt:"2026-06-06",rf:["Off-topic","Low salary"],en:false,note:"Auto-dismissed: Off-topic — nursery director role"},
    {id:932,title:"DIRECTEUR DE MAGASIN F/H",company:"Centrakor",src:"Indeed",loc:"Saint-Martin-d'Hères (38)",sal:null,url:"Not available",gurl:"https://mail.google.com/mail/u/0/#all/19ea36dd7ccfa33e",kw:"finance director",dt:"2026-06-06",rf:["Off-topic"],en:false,note:"Auto-dismissed: Off-topic — retail store director"},
    {id:933,title:"Directeur d'agence H/F",company:"VITALIS MEDICAL",src:"Indeed",loc:"Grenoble (38)",sal:null,url:"Not available",gurl:"https://mail.google.com/mail/u/0/#all/19ea36dd7ccfa33e",kw:"finance director",dt:"2026-06-06",rf:["Off-topic"],en:false,note:"Auto-dismissed: Off-topic — medical staffing agency director"},
    {id:934,title:"Directeur d'agence d'intérim et de recrutement indépendant H/F",company:"Lynx RH",src:"Indeed",loc:"Chambéry (73)",sal:null,url:"Not available",gurl:"https://mail.google.com/mail/u/0/#all/19ea36dd7ccfa33e",kw:"finance director",dt:"2026-06-06",rf:["Off-topic"],en:false,note:"Auto-dismissed: Off-topic — recruitment agency director"},
    {id:935,title:"Directeur administratif et financier/Directrice administrative et financière",company:"LB Ressources",src:"LinkedIn",loc:"Aix-en-Provence",sal:null,url:"https://www.linkedin.com/jobs/view/4423361398/",gurl:"https://mail.google.com/mail/u/0/#all/19ea2c984b136415",kw:"LinkedIn",dt:"2026-06-06",rf:["Far location"],en:false,note:"Auto-dismissed: Far location — Aix-en-Provence (~4h from Grenoble)"},
    {id:938,title:"DAF PME F/H - Bourgogne",company:"LIVINGSTONE RH",src:"LinkedIn",loc:"Bourgogne-Franche-Comté",sal:null,url:"https://www.linkedin.com/jobs/view/4416204726/",gurl:"https://mail.google.com/mail/u/0/#all/19ea2c984b136415",kw:"LinkedIn",dt:"2026-06-06",rf:["Far location"],en:false,note:"Auto-dismissed: Far location — Bourgogne region"},
    {id:951,title:"Gestionnaire Achats H/F",company:"Davidson consulting",src:"LinkedIn",loc:null,sal:null,url:"Not available",gurl:"https://mail.google.com/mail/u/0/#all/19ea78199475002e",kw:"Responsable Achats OR Acheteur Senior",dt:"2026-06-07",rf:["Off-topic","Junior scope"],en:false,note:"Auto-dismissed: Off-topic — junior procurement/purchasing role"},
    {id:960,title:"Expert-Comptable H/F",company:"Skills Grenoble",src:"Direct",loc:"Grenoble",sal:null,url:"Not available",gurl:"https://mail.google.com/mail/u/0/#all/19ead452129545f4",kw:"Expert-Comptable",dt:"2026-06-08",rf:["Off-topic"],en:false,note:"Auto-dismissed: Requires French Expert-Comptable (CPA) qualification"}
  ];

  let dismissedCount = 0;
  for (const r of dismissed) {
    await c.query(
      "INSERT INTO job_applications (job_title,company,source,location,salary,priority,cv_approach,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id,user_profile) VALUES ($1,$2,$3,$4,$5,'C','Standard','Dismissed',$6,$7,$8,$9,'[]',$10,$11,$12,null,$13,'zberlo') RETURNING id",
      [r.title,r.company,r.src,r.loc,r.sal,r.dt,r.url,r.gurl,JSON.stringify(r.rf),r.kw,r.note,r.en,r.id]
    );
    await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile='zberlo'", [r.id]);
    dismissedCount++;
  }
  console.log('DISMISSED_INSERTED:' + dismissedCount);

  // Needs Info rows → review_queue
  const needsInfo = [
    {id:936,title:"Directeur administratif et financier/Directrice administrative et financière",company:"Les Phénix",src:"LinkedIn",loc:"Nyons",sal:null,url:"https://www.linkedin.com/jobs/view/4418801874/",gurl:"https://mail.google.com/mail/u/0/#all/19ea2c984b136415",kw:"LinkedIn",dt:"2026-06-06",rf:[],mi:["Salary","Hybrid policy","Scope"],en:false,note:"QUEUED: DAF role at Les Phénix — Nyons (Drôme, ~1h30), missing salary, hybrid policy and full JD"},
    {id:939,title:"Manager équipe comptable H/F",company:"Wiico",src:"Indeed",loc:null,sal:"45000-60000",url:"Not available",gurl:"https://mail.google.com/mail/u/0/#all/19ea1891f30d5262",kw:"Indeed Match",dt:"2026-06-06",rf:["Low salary"],mi:["Location","Hybrid policy"],en:false,note:"QUEUED: Accounting team manager via Wiico — salary 45-60K (below €65K apply floor), missing location"},
    {id:946,title:"Pilote Financier",company:"ACEPP 38",src:"Indeed",loc:"Grenoble (38)",sal:null,url:"Not available",gurl:"https://mail.google.com/mail/u/0/#all/19ea834f74627cbf",kw:"Pilote Financier",dt:"2026-06-07",rf:[],mi:["Salary","Scope"],en:false,note:"QUEUED: Finance pilot at ACEPP 38 (non-profit childcare association) — Grenoble Green zone, missing salary and scope"},
    {id:952,title:"Responsable Comptable H/F",company:"Brun Invest",src:"Direct",loc:null,sal:null,url:"Not available",gurl:"https://mail.google.com/mail/u/0/#all/19ea6e27387a19d4",kw:"Responsable Comptable",dt:"2026-06-07",rf:[],mi:["Location","Salary"],en:false,note:"QUEUED: Accounting manager at Brun Invest — missing location and salary"},
    {id:954,title:"Controleur de Gestion Operationnelle H/F",company:"STEF",src:"Direct",loc:null,sal:null,url:"Not available",gurl:"https://mail.google.com/mail/u/0/#all/19eab95551345d3a",kw:"Contrôleur de Gestion",dt:"2026-06-08",rf:[],mi:["Location","Salary"],en:false,note:"QUEUED: Operational CDG at STEF (logistics/food distribution) — missing location and salary"},
    {id:957,title:"Comptable général H/F",company:"Page Personnel",src:"Indeed",loc:null,sal:null,url:"Not available",gurl:"https://mail.google.com/mail/u/0/#all/19eabd92686af6d3",kw:"Indeed Match",dt:"2026-06-08",rf:[],mi:["Location","Salary","Scope"],en:false,note:"QUEUED: General accountant via Page Personnel — salary data corrupted in alert email, missing location and scope"},
    {id:958,title:"Directeur de projet Sénior H/F",company:"France Travail",src:"LinkedIn",loc:null,sal:null,url:"Not available",gurl:"https://mail.google.com/mail/u/0/#all/19eac39c0e93f7af",kw:"Responsable Supply Chain OR Supply Chain Manager",dt:"2026-06-08",rf:[],mi:["Salary","Scope"],en:false,note:"OPERATIONAL ROLE — review for fit; Senior Project Director at France Travail (employment agency), likely IT/organizational — verify finance scope"},
    {id:962,title:"Gestionnaire administratif et financier H/F",company:"France Travail",src:"LinkedIn",loc:null,sal:null,url:"Not available",gurl:"https://mail.google.com/mail/u/0/#all/19eadf16875fcc4a",kw:"LinkedIn",dt:"2026-06-08",rf:[],mi:["Location","Salary"],en:false,note:"QUEUED: Admin/financial manager at France Travail (public sector) — missing location and salary, typically lower pay in public sector"}
  ];

  let needsInfoCount = 0;
  for (const r of needsInfo) {
    await c.query(
      "INSERT INTO review_queue (job_title,company,source,location,salary,priority,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id,user_profile) VALUES ($1,$2,$3,$4,$5,'B','Needs Info',$6,$7,$8,$9,$10,$11,$12,$13,null,$14,'zberlo') RETURNING id",
      [r.title,r.company,r.src,r.loc,r.sal,r.dt,r.url,r.gurl,JSON.stringify(r.rf),JSON.stringify(r.mi),r.kw,r.note,r.en,r.id]
    );
    await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile='zberlo'", [r.id]);
    needsInfoCount++;
  }
  console.log('NEEDS_INFO_INSERTED:' + needsInfoCount);

  // Manual check rows → review_queue
  const manual = [
    {id:924,src:"Cadremploi",gurl:"https://mail.google.com/mail/u/0/#all/19ea27ee78d3f32f",kw:"Directeur Financier OR DAF OR Finance Director",dt:"2026-06-06",note:"UNREADABLE: Cadremploi HTML-only profil interessant promo email — open Gmail link to review and paste JD"},
    {id:925,src:"Cadremploi",gurl:"https://mail.google.com/mail/u/0/#all/19ea1a134e9d6ffd",kw:"Financial Controller OR Finance Manager",dt:"2026-06-06",note:"UNREADABLE: Cadremploi 3 offres Financial Controller/Finance Manager — 08/06/2026 — HTML-only, open Gmail to review"},
    {id:940,src:"APEC",gurl:"https://mail.google.com/mail/u/0/#all/19ea58a4f713bc84",kw:"APEC Finance/Gestion",dt:"2026-06-07",note:"UNREADABLE: APEC 1 offre — 08/06/2026 — HTML-only — check apec.fr manually"},
    {id:941,src:"Cadremploi",gurl:"https://mail.google.com/mail/u/0/#all/19ea591a5ce9eda0",kw:"Contrôleur de Gestion OR Responsable Contrôle de Gestion",dt:"2026-06-07",note:"UNREADABLE: Cadremploi 1 nouvelle offre CDG publiee semaine derniere — HTML-only, open Gmail to review"},
    {id:942,src:"Cadremploi",gurl:"https://mail.google.com/mail/u/0/#all/19ea6c598e9f766f",kw:"Credit Manager OR RAF OR Responsable Achats",dt:"2026-06-07",note:"UNREADABLE: Cadremploi multi-alert batch 08/06 — Credit Manager, RAF, Responsable Achats keywords — HTML-only, open Gmail to review"},
    {id:944,src:"Cadremploi",gurl:"https://mail.google.com/mail/u/0/#all/19ea808ded83d602",kw:"Directeur Financier OR DAF OR Finance Director",dt:"2026-06-07",note:"UNREADABLE: Cadremploi HTML-only profil interessant promo email — open Gmail link to review"},
    {id:945,src:"Indeed",gurl:"https://mail.google.com/mail/u/0/#all/19ea855423df805f",kw:"finance director",dt:"2026-06-07",note:"UNREADABLE: Indeed multi 12 offres finance director Grenoble 08/06 — open Gmail to review; featured: VMC Bois RAF Saint-Ondras (below floor); recurring batch"},
    {id:953,src:"APEC",gurl:"https://mail.google.com/mail/u/0/#all/19eab56f8cdd6804",kw:"APEC Finance/Gestion",dt:"2026-06-08",note:"UNREADABLE: APEC 8 offres — 09/06/2026 — HTML-only — check apec.fr manually"},
    {id:956,src:"Cadremploi",gurl:"https://mail.google.com/mail/u/0/#all/19eabed04081ff42",kw:"Financial Controller OR Finance Manager",dt:"2026-06-08",note:"UNREADABLE: Cadremploi 3 offres Financial Controller/Finance Manager — 09/06/2026 — HTML-only, open Gmail to review"},
    {id:961,src:"Cadremploi",gurl:"https://mail.google.com/mail/u/0/#all/19eacef3321fbf20",kw:"Directeur Financier OR DAF OR Finance Director",dt:"2026-06-08",note:"UNREADABLE: Cadremploi HTML-only profil interessant promo email — open Gmail link to review"},
    {id:963,src:"LinkedIn",gurl:"https://mail.google.com/mail/u/0/#all/19ead835698bfd63",kw:"LinkedIn",dt:"2026-06-08",note:"UNREADABLE: LinkedIn CDG recommendations digest — jobs similar to Controleur de gestion at Forum refugies; open to view full listings"},
    {id:964,src:"Indeed",gurl:"https://mail.google.com/mail/u/0/#all/19ead7b136adaa71",kw:"finance director",dt:"2026-06-08",note:"UNREADABLE: Indeed multi 12 offres finance director Grenoble 09/06 — open Gmail to review; featured: Grenoble-INP Directeur Operationnel DFP (operational)"},
    {id:966,src:"Indeed",gurl:"https://mail.google.com/mail/u/0/#all/19eae34b9c5feca9",kw:"Pilote Financier",dt:"2026-06-08",note:"UNREADABLE: Indeed multi 3 offres Pilote Financier Grenoble — open Gmail to review; featured: Ville de Saint-Egreve RESPONSABLE SERVICE JEUNESSE (non-finance)"}
  ];

  let manualCount = 0;
  for (const r of manual) {
    await c.query(
      "INSERT INTO review_queue (job_title,company,source,location,salary,priority,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id,user_profile) VALUES ('Not disclosed','Not disclosed',$1,null,null,'B','Needs Info',$2,'Not available',$3,'[]','[\"Full JD\"]',$4,$5,false,null,$6,'zberlo') RETURNING id",
      [r.src,r.dt,r.gurl,r.kw,r.note,r.id]
    );
    await c.query("UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile='zberlo'", [r.id]);
    manualCount++;
  }
  console.log('MANUAL_INSERTED:' + manualCount);

  // New companies (not already in target_companies)
  const newCos = [
    {company:"Les Phénix",location:"Nyons"},
    {company:"Wiico",location:null},
    {company:"ACEPP 38",location:"Grenoble"},
    {company:"Brun Invest",location:null},
    {company:"STEF",location:null}
  ];

  let newCoCount = 0;
  for (const co of newCos) {
    const res = await c.query(
      "INSERT INTO target_companies (company,tier,location,notes,user_profile) VALUES ($1,'C',$2,'Auto-added from daily scan Jun 10','zberlo') ON CONFLICT DO NOTHING RETURNING id",
      [co.company, co.location]
    );
    if (res.rowCount > 0) newCoCount++;
  }
  console.log('NEW_COMPANIES:' + newCoCount);

  await c.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
