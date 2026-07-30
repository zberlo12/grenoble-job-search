const {Client}=require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const c=new Client({connectionString:'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'});

const inserts=[
  {
    rq_id:378,
    job_title:'Contrôleur.euse de gestion',
    company:'Soitec',
    source:'LinkedIn',
    location:'Bernin (38)',
    salary:null,
    priority:'B',
    cv_approach:'costcontrol-fr',
    status:'To Apply',
    date_added:'2026-06-01',
    job_url:'https://www.linkedin.com/jobs/view/4418776241/',
    gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e87bf652b78ee3',
    red_flags:JSON.stringify([]),
    missing_info:JSON.stringify(['Salary']),
    alert_keyword:'Contrôleur de Gestion OR CDG Industriel',
    notes:"Soitec Bernin (Green zone, 15km). Premier Grenoble semiconductor employer. CDG role fits cost control & industrial controlling background. Salary unknown but likely at/above floor given company scale. Apply now, confirm salary at interview.",
    english:false
  },
  {
    rq_id:416,
    job_title:'Pilote Financier',
    company:'Société Dauphinoise pour l\'Habitat',
    source:'Indeed',
    location:'Grenoble (38)',
    salary:null,
    priority:'B',
    cv_approach:'fpa-fr',
    status:'To Apply',
    date_added:'2026-06-03',
    job_url:null,
    gmail_thread_url:null,
    red_flags:JSON.stringify([]),
    missing_info:JSON.stringify(['Salary']),
    alert_keyword:'Pilote Financier',
    notes:"SDH (Société Dauphinoise pour l'Habitat) Grenoble — known target company. Pilote Financier is FP&A-adjacent; strong company-role fit. Green zone, public housing sector. Missing salary but public sector transparency likely.",
    english:false
  },
  {
    rq_id:415,
    job_title:'Contrôleur de Gestion',
    company:'VINCI Energies',
    source:'Indeed',
    location:'Grenoble (38)',
    salary:null,
    priority:'B',
    cv_approach:'costcontrol-fr',
    status:'To Apply',
    date_added:'2026-06-03',
    job_url:null,
    gmail_thread_url:null,
    red_flags:JSON.stringify([]),
    missing_info:JSON.stringify(['Salary']),
    alert_keyword:'Contrôleur de Gestion',
    notes:"VINCI Energies CDG Grenoble (Green zone). Major infrastructure group, solid brand. CDG role matches cost control experience. Salary unconfirmed — apply and clarify at screen.",
    english:false
  },
  {
    rq_id:375,
    job_title:'Cost Controller',
    company:'PIMAN Group',
    source:'LinkedIn',
    location:'Grenoble (38)',
    salary:null,
    priority:'B',
    cv_approach:'costcontrol-fr',
    status:'To Apply',
    date_added:'2026-06-01',
    job_url:'https://www.linkedin.com/jobs/view/4422829528/',
    gmail_thread_url:'https://mail.google.com/mail/u/0/#all/19e8751c3faff741',
    red_flags:JSON.stringify([]),
    missing_info:JSON.stringify(['Salary','Hybrid policy']),
    alert_keyword:'Responsable Administratif Financier OR RAF',
    notes:"PIMAN Group Cost Controller Grenoble (Green zone). Cost Controller directly maps to costcontrol-fr approach. PIMAN already tracked as target company. Missing salary and hybrid — apply and confirm details at call.",
    english:false
  },
  {
    rq_id:417,
    job_title:'Contrôleur de Gestion',
    company:'VMC Bois',
    source:'Indeed',
    location:'Grenoble (38)',
    salary:null,
    priority:'B',
    cv_approach:'costcontrol-fr',
    status:'To Apply',
    date_added:'2026-06-03',
    job_url:null,
    gmail_thread_url:null,
    red_flags:JSON.stringify([]),
    missing_info:JSON.stringify(['Salary']),
    alert_keyword:'Contrôleur de Gestion',
    notes:"VMC Bois CDG Grenoble (Green zone). Industrial materials company. Controlling role fits cost control experience. Salary unconfirmed — apply and clarify.",
    english:false
  }
];

const insertSQL=`INSERT INTO job_applications
(job_title,company,source,location,salary,priority,cv_approach,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,user_profile)
VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
RETURNING id`;

async function run(){
  await c.connect();
  for(const row of inserts){
    const res=await c.query(insertSQL,[
      row.job_title,row.company,row.source,row.location,row.salary,
      row.priority,row.cv_approach,row.status,row.date_added,
      row.job_url,row.gmail_thread_url,row.red_flags,row.missing_info,
      row.alert_keyword,row.notes,row.english,'zberlo'
    ]);
    const newId=res.rows[0].id;
    await c.query('DELETE FROM review_queue WHERE id=$1',[row.rq_id]);
    console.log(`OK ${row.company} (${row.job_title}) => job_applications id=${newId}, rq_id=${row.rq_id} deleted`);
  }
  await c.end();
}
run().catch(e=>{console.error(e.message);process.exit(1);});
