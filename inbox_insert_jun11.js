'use strict';
const {Client}=require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const c=new Client({connectionString:'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'});
const UP='zberlo';
const TODAY='2026-06-11';

// Stale "Potentially Apply" entries in review_queue — already promoted to
// job_applications (ids 688, 689, 691) but DELETE was not run at the time.
const STALE_RQ_IDS=[435,438,439];

// 4 new finds from Jun 10-11 daily scan — entering as Needs Info
const NEW=[
  {
    job_title:'DAF Retail (h/f)',
    company:'LHH',
    source:'LinkedIn',
    location:'Voiron (38)',
    salary:null,
    priority:'B',
    status:'Needs Info',
    date_added:TODAY,
    job_url:null,
    gmail_thread_url:null,
    red_flags:JSON.stringify([]),
    missing_info:JSON.stringify(['Salary','Company name','Full JD']),
    alert_keyword:'Directeur Administratif et Financier OR DAF',
    notes:"Employer hidden — posted via LHH recruiter. Yellow zone (Voiron), confirm hybrid before writing docs.",
    english:false
  },
  {
    job_title:'Contrôleur de gestion industrielle',
    company:'TALENTS FINANCE',
    source:'LinkedIn',
    location:'Voreppe (38)',
    salary:null,
    priority:'B',
    status:'Needs Info',
    date_added:TODAY,
    job_url:null,
    gmail_thread_url:null,
    red_flags:JSON.stringify([]),
    missing_info:JSON.stringify(['Salary','Company name','Full JD']),
    alert_keyword:'Contrôleur de Gestion OR CDG Industriel',
    notes:"Via TALENTS FINANCE (recruiter) — actual employer TBD. Green zone (Voreppe, ~15km). CDG industrielle fits cost-control approach.",
    english:false
  },
  {
    job_title:'Contrôleur de gestion',
    company:'Korus Group',
    source:'LinkedIn',
    location:'La Murette (38)',
    salary:null,
    priority:'B',
    status:'Needs Info',
    date_added:TODAY,
    job_url:null,
    gmail_thread_url:null,
    red_flags:JSON.stringify([]),
    missing_info:JSON.stringify(['Salary','Full JD']),
    alert_keyword:'Contrôleur de Gestion',
    notes:"Korus Group La Murette — Green zone (Voreppe/Grenoble corridor). Confirm scope and salary.",
    english:false
  },
  {
    job_title:'Strategic Finance Manager',
    company:'Jobgether',
    source:'Other',
    location:'Remote (France)',
    salary:null,
    priority:'B',
    status:'Needs Info',
    date_added:TODAY,
    job_url:null,
    gmail_thread_url:null,
    red_flags:JSON.stringify([]),
    missing_info:JSON.stringify(['Salary','Company name','Full JD']),
    alert_keyword:'Finance Manager OR Finance Director',
    notes:"Remote role via Jobgether — actual employer TBD. English-language title, remote-first. Confirm employer and salary.",
    english:true
  }
];

const INSERT_SQL=`INSERT INTO review_queue
(job_title,company,source,location,salary,priority,status,date_added,
 job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,user_profile)
VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
RETURNING id`;

async function run(){
  await c.connect();

  // 1. Remove stale Potentially Apply rows
  for(const id of STALE_RQ_IDS){
    await c.query('DELETE FROM review_queue WHERE id=$1 AND user_profile=$2',[id,UP]);
    console.log(`DELETED stale rq id=${id}`);
  }

  // 2. Insert 4 new Needs Info entries
  for(const row of NEW){
    const res=await c.query(INSERT_SQL,[
      row.job_title,row.company,row.source,row.location,row.salary,
      row.priority,row.status,row.date_added,
      row.job_url,row.gmail_thread_url,row.red_flags,row.missing_info,
      row.alert_keyword,row.notes,row.english,UP
    ]);
    console.log(`INSERTED ${row.company} (${row.job_title}) => rq id=${res.rows[0].id}`);
  }

  await c.end();
  console.log('Done.');
}
run().catch(e=>{console.error(e.message);process.exit(1);});
