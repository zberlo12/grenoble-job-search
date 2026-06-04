'use strict';
const { Client } = require('C:/Users/zberl/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-postgres/node_modules/pg');
const CONN = 'postgresql://postgres.ginjhaioodmaqfajtinv:oc3Ww2P00Em9PZcG@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';
const UP = 'zberlo';
const TU = 'https://mail.google.com/mail/u/0/#all/';

const ROWS = [
  { tid:'19e8f2acc5769bf6', src:'Indeed', ak:'Responsable Administratif Financier',
    title:'Responsable Administratif et Financier H/F', co:'VMC Bois', loc:'Saint-Ondras (38)',
    sal:'33000', url:'https://fr.indeed.com/viewjob?jk=e764b29182ac8e', ps:'pending', en:false, parseDate:'2026-06-03',
    dest:'job_applications', status:'Dismissed', priority:'C',
    notes:'Auto-dismissed: Low salary (33K/an, below 52K floor)', rf:['Low salary'], missing:[] },
  { tid:'19e8f699942be8c5', src:'Indeed', ak:'Controleur de Gestion',
    title:'Controleur de gestion senior H/F', co:'Konica Minolta', loc:'Carrieres-sur-Seine (Ile-de-France)',
    sal:null, url:'Not available', ps:'pending', en:false, parseDate:'2026-06-03',
    dest:'job_applications', status:'Dismissed', priority:'C',
    notes:'Auto-dismissed: Far location (Carrieres-sur-Seine, Ile-de-France)', rf:['Far location'], missing:[] },
  { tid:'19e8e718c494e62f', src:'Indeed', ak:'finance director',
    title:'Charge(e) des marches et gestion financiere et administrative H/F', co:'Ville de Saint-Egreve', loc:'Saint-Egreve (38)',
    sal:null, url:'https://fr.indeed.com/viewjob?jk=68a683ad65caf9', ps:'pending', en:false, parseDate:'2026-06-03',
    dest:'review_queue', status:'Needs Info', priority:'B',
    notes:'QUEUED: Gestion financiere/marches at Ville de Saint-Egreve (Green zone). Public sector, salary and hybrid missing.',
    rf:[], missing:['Salary','Hybrid policy'] },
  { tid:'19e8d619986d56eb', src:'Direct', ak:'Responsable Comptable',
    title:'Responsable Comptable H/F', co:'CDI Flex (placement)', loc:null,
    sal:null, url:null, ps:'manual_check', pn:'HelloWork HTML-only 3 offres open Gmail to review', en:false, parseDate:'2026-06-03',
    dest:'review_queue', status:'Needs Info', priority:'B',
    notes:'UNREADABLE: HelloWork CDI Flex recrute Responsable Comptable + 2 autres — open Gmail link to review and paste JD',
    rf:[], missing:['Full JD'] },
  { tid:'19e8c88ce725e124', src:'Cadremploi', ak:'Supply Chain OR RAF',
    title:'Various Supply Chain / RAF roles', co:'Not disclosed', loc:null,
    sal:null, url:null, ps:'manual_check', pn:'Cadremploi Supply Chain + RAF morning 03/06 HTML-only', en:false, parseDate:'2026-06-03',
    dest:'review_queue', status:'Needs Info', priority:'B',
    notes:'UNREADABLE: Cadremploi Supply Chain/RAF alerts 03/06 morning — open Gmail link to review',
    rf:[], missing:['Full JD'] },
];

async function run() {
  const client = new Client({ connectionString: CONN });
  await client.connect();
  let pendingInserted=0, manualInserted=0, needsInfo=0, dismissed=0, urlDedup=0;

  for (const row of ROWS) {
    if (row.ps === 'pending' && row.url && row.url !== 'Not available') {
      const m = row.url.match(/jk=([a-f0-9]+)/);
      if (m) {
        const d = await client.query(
          'SELECT id FROM listing_inbox WHERE job_url ILIKE $1 AND parse_date >= CURRENT_DATE - 7 AND user_profile=$2 LIMIT 1',
          ['%'+m[1]+'%', UP]);
        if (d.rows.length > 0) { urlDedup++; console.log('URL_DEDUP skip:', row.title); continue; }
      }
    }

    const { rows:[li] } = await client.query(`
      INSERT INTO listing_inbox
        (parse_date,gmail_thread_id,gmail_thread_url,source,alert_keyword,
         job_title,company,location,salary,job_url,parse_status,parse_notes,english,raw_snippet,user_profile)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id
    `, [row.parseDate,row.tid,TU+row.tid,row.src,row.ak,
        row.title,row.co,row.loc,row.sal,row.url||null,row.ps,row.pn||null,row.en,
        row.title+' — '+row.co+' — '+(row.loc||''), UP]);

    row.ps === 'manual_check' ? manualInserted++ : pendingInserted++;

    if (row.dest === 'review_queue') {
      await client.query(`
        INSERT INTO review_queue
          (job_title,company,source,location,salary,priority,status,date_added,
           job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,listing_inbox_id,user_profile)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      `, [row.title,row.co,row.src,row.loc,row.sal,row.priority,row.status,row.parseDate,
          row.url||null,TU+row.tid,JSON.stringify(row.rf),JSON.stringify(row.missing),
          row.ak,row.notes,row.en,li.id,UP]);
      needsInfo++;
    } else {
      await client.query(`
        INSERT INTO job_applications
          (job_title,company,source,location,salary,priority,status,date_added,
           job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,listing_inbox_id,user_profile)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      `, [row.title,row.co,row.src,row.loc,row.sal,row.priority,row.status,row.parseDate,
          row.url||null,TU+row.tid,JSON.stringify(row.rf),JSON.stringify(row.missing),
          row.ak,row.notes,row.en,li.id,UP]);
      dismissed++;
    }
    await client.query('UPDATE listing_inbox SET parse_status=$1 WHERE id=$2',['processed',li.id]);
  }

  console.log('Done: pending='+pendingInserted+' manual='+manualInserted+' needs_info='+needsInfo+' dismissed='+dismissed+' url_dedup='+urlDedup);
  await client.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
