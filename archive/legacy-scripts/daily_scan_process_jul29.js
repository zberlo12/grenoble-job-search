const {Client} = require(process.env.PG_MODULE);
const c = new Client({connectionString: process.env.PG_CONN});
const USER_PROFILE = 'zberlo';

// decision: 'dismiss' | 'needs_info' | 'operational' | 'priority_b' | 'priority_a'
const DECISIONS = {
  1604: {decision:'dismiss', red_flags:['Low salary'], notes:'Auto-dismissed: Low salary (~23-24k/an), CDD academic admin role'},
  1605: {decision:'needs_info', missing_info:['Salary','Scope']},
  1606: {decision:'needs_info', missing_info:['Salary']},
  1607: {decision:'priority_b'},
  1608: {decision:'needs_info', missing_info:['Salary','Scope']},
  1609: {decision:'dismiss', red_flags:['Off-topic'], notes:'Auto-dismissed: Teaching/education role, not corporate finance'},
  1610: {decision:'needs_info', missing_info:['Salary']},
  1611: {decision:'needs_info', missing_info:['Salary','Scope']},
  1612: {decision:'dismiss', red_flags:['Off-topic','Low salary'], notes:'Auto-dismissed: Nursing home director role, not finance; salary below floor'},
  1613: {decision:'needs_info', missing_info:['Salary','Company name']},
  1614: {decision:'needs_info', missing_info:['Salary','Scope']},
  1615: {decision:'priority_b', override:{location:'Champagnier', salary:'45 000 - 65 000 € / an', contract_type:'CDI'}},
  1616: {decision:'operational'},
  1617: {decision:'needs_info', missing_info:['Salary','Scope']},
  1618: {decision:'dismiss', red_flags:['Low salary','Off-topic'], notes:'Auto-dismissed: Non-finance generalist exec role (transport federation), salary below floor'},
  1619: {decision:'operational'},
  1620: {decision:'dismiss', red_flags:['Off-topic'], notes:'Auto-dismissed: Highway operations management role, not finance'},
  1621: {decision:'dismiss', red_flags:['Off-topic'], notes:'Auto-dismissed: Construction/AMO project management role, not finance'},
  1622: {decision:'needs_info', missing_info:['Salary','Scope']},
  1623: {decision:'needs_info', missing_info:['Salary','Scope']},
  1624: {decision:'operational'},
  1625: {decision:'needs_info', missing_info:['Salary','Scope']},
  1626: {decision:'needs_info', missing_info:['Salary']},
  1627: {decision:'operational'},
  1628: {decision:'operational'},
  1629: {decision:'operational'},
  1631: {decision:'dup_expected'},
  1632: {decision:'dismiss', red_flags:['Far location'], notes:'Auto-dismissed: Paris-area location (Noisy-le-Grand), not commutable/no hybrid stated'},
  1633: {decision:'dismiss', red_flags:['Far location'], notes:'Auto-dismissed: Far location (Normandy)'},
  1634: {decision:'needs_info', missing_info:['Salary','Hybrid policy']},
  1636: {decision:'dup_expected'},
  1637: {decision:'operational'},
  1638: {decision:'dup_expected'},
  1639: {decision:'dup_expected'},
  1641: {decision:'dup_expected'},
  1642: {decision:'needs_info', missing_info:['Salary','Hybrid policy']},
  1643: {decision:'dismiss', red_flags:['Far location'], notes:'Auto-dismissed: Far location (Finistère, Brittany)'},
  1644: {decision:'dismiss', red_flags:['Far location'], notes:'Auto-dismissed: Far location (Vendée)'},
  1646: {decision:'dup_expected'},
  1647: {decision:'operational'},
  1648: {decision:'dup_expected'},
  1649: {decision:'dup_expected'},
  1651: {decision:'dup_expected'},
  1652: {decision:'dup_expected'},
  1653: {decision:'dup_expected'},
  1654: {decision:'dup_expected'},
  1656: {decision:'dup_expected'},
  1657: {decision:'needs_info', missing_info:['Salary','Hybrid policy']},
  1658: {decision:'dismiss', red_flags:['Far location'], notes:'Auto-dismissed: Far location (Angers)'},
  1659: {decision:'dismiss', red_flags:['Far location'], notes:'Auto-dismissed: Far location (Nantes)'},
  1661: {decision:'priority_b'},
  1662: {decision:'needs_info', missing_info:['Salary']},
  1663: {decision:'priority_a', cv_approach:'Standard'},
  1664: {decision:'priority_a', cv_approach:'Standard'},
  1665: {decision:'needs_info', missing_info:['Salary']},
  1666: {decision:'needs_info', missing_info:['Salary']},
  1667: {decision:'dup_expected'},
  1668: {decision:'operational'},
  1669: {decision:'dup_expected'},
  1673: {decision:'dismiss', red_flags:['Far location'], notes:'Auto-dismissed: Remote North America role, not viable for France-based candidate'},
  1674: {decision:'priority_a', cv_approach:'Standard'},
};

const AGENCY_SKIP = /Agence|Cabinet de recrutement|Recruteur ind[ée]pendant|RH Partenaires|Bras Droit/i;

function coreTitle(title) {
  return title.replace(/\s*\(?[HF]\/F\)?/gi,'').replace(/\s*F\/H/gi,'').trim().slice(0,40);
}

async function run() {
  await c.connect();
  const ids = Object.keys(DECISIONS).map(Number).sort((a,b)=>a-b);

  const existingCompaniesRes = await c.query('SELECT company FROM target_companies WHERE user_profile=$1',[USER_PROFILE]);
  const existingCompanies = existingCompaniesRes.rows.map(r=>r.company.toLowerCase());
  const newCompanies = [];

  let counts = {dismissed:0, needs_info:0, priority_b:0, priority_a:0, duplicates:0, errors:[]};

  for (const id of ids) {
    const cfg = DECISIONS[id];
    const rowRes = await c.query('SELECT * FROM listing_inbox WHERE id=$1 AND user_profile=$2',[id, USER_PROFILE]);
    if (rowRes.rows.length === 0) { counts.errors.push(`id ${id} not found`); continue; }
    const row = rowRes.rows[0];
    const job_title = row.job_title;
    const company = row.company;
    const location = cfg.override?.location || row.location;
    const salary = cfg.override?.salary || row.salary;
    const contract_type = cfg.override?.contract_type || row.contract_type;

    // Dedup check 1: URL
    if (row.job_url && row.job_url !== 'Not available') {
      const urlDup = await c.query(
        `SELECT id FROM (SELECT id FROM job_applications WHERE job_url=$1 AND user_profile=$2 UNION ALL SELECT id FROM review_queue WHERE job_url=$1 AND user_profile=$2) t LIMIT 1`,
        [row.job_url, USER_PROFILE]
      );
      if (urlDup.rows.length > 0) {
        await c.query(`UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2`,[id, USER_PROFILE]);
        counts.duplicates++; continue;
      }
    }
    // Dedup check 2: company + core title ILIKE
    const core = coreTitle(job_title);
    const compDup = await c.query(
      `SELECT id FROM (SELECT id FROM job_applications WHERE company ILIKE $1 AND job_title ILIKE $2 AND user_profile=$3 UNION ALL SELECT id FROM review_queue WHERE company ILIKE $1 AND job_title ILIKE $2 AND user_profile=$3) t LIMIT 1`,
      [`%${company}%`, `%${core}%`, USER_PROFILE]
    );
    if (compDup.rows.length > 0) {
      await c.query(`UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2`,[id, USER_PROFILE]);
      counts.duplicates++; continue;
    }

    if (cfg.decision === 'dup_expected') {
      // Expected duplicate but SQL dedup did not catch it (defensive) - insert as review_queue Needs Info low-priority to avoid silent loss
      cfg.decision = 'needs_info';
      cfg.missing_info = cfg.missing_info || ['Salary'];
      cfg.notes = (cfg.notes||'') + ' [Note: expected repost duplicate, but no DB match found — verify]';
    }

    let table, status, priority = null, notes = cfg.notes || null;
    let red_flags = cfg.red_flags || [];
    let missing_info = cfg.missing_info || [];

    if (cfg.decision === 'dismiss') {
      table='job_applications'; status='Dismissed'; priority=null;
      counts.dismissed++;
    } else if (cfg.decision === 'operational') {
      table='review_queue'; status='Needs Info'; priority='B';
      notes = 'OPERATIONAL ROLE — review for fit';
      counts.needs_info++;
    } else if (cfg.decision === 'needs_info') {
      table='review_queue'; status='Needs Info'; priority='B';
      notes = notes || ('QUEUED: missing ' + missing_info.join(', '));
      if (!notes.startsWith('QUEUED') && !notes.startsWith('OPERATIONAL')) notes = 'QUEUED: ' + notes;
      counts.needs_info++;
    } else if (cfg.decision === 'priority_b') {
      table='review_queue'; status='To Assess'; priority='B';
      counts.priority_b++;
    } else if (cfg.decision === 'priority_a') {
      table='job_applications'; status='To Apply'; priority='A';
      counts.priority_a++;
    }

    const job_description = row.raw_body ? row.raw_body.slice(0,4000) : null;
    const date_added = row.parse_date;

    let insertedId;
    if (table === 'job_applications') {
      const r = await c.query(
        `INSERT INTO job_applications
         (job_title,company,source,location,salary,priority,cv_approach,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id,user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id`,
        [job_title, company, row.source, location, salary, priority, cfg.cv_approach || null, status, date_added,
         row.job_url, row.gmail_thread_url, JSON.stringify(red_flags), JSON.stringify(missing_info), row.alert_keyword,
         notes, false, job_description, id, USER_PROFILE]
      );
      insertedId = r.rows[0].id;
    } else {
      const r = await c.query(
        `INSERT INTO review_queue
         (job_title,company,source,location,salary,priority,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description,listing_inbox_id,user_profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id`,
        [job_title, company, row.source, location, salary, priority, status, date_added,
         row.job_url, row.gmail_thread_url, JSON.stringify(red_flags), JSON.stringify(missing_info), row.alert_keyword,
         notes, false, job_description, id, USER_PROFILE]
      );
      insertedId = r.rows[0].id;
    }

    await c.query(`UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2`,[id, USER_PROFILE]);

    if (cfg.decision !== 'dismiss' && company && !AGENCY_SKIP.test(company) && company !== 'Not disclosed' &&
        !existingCompanies.includes(company.toLowerCase()) && !newCompanies.some(nc=>nc.toLowerCase()===company.toLowerCase())) {
      newCompanies.push(company);
    }
  }

  let companiesInserted = 0;
  for (const comp of newCompanies) {
    const locRes = await c.query(`SELECT location FROM job_applications WHERE company=$1 AND user_profile=$2 UNION SELECT location FROM review_queue WHERE company=$1 AND user_profile=$2 LIMIT 1`,[comp, USER_PROFILE]);
    const loc = locRes.rows[0]?.location || null;
    await c.query(`INSERT INTO target_companies (company, tier, location, notes, user_profile) VALUES ($1,'C',$2,'Auto-captured from daily scan Jul 29',$3)`,[comp, loc, USER_PROFILE]);
    companiesInserted++;
  }

  console.log(JSON.stringify({counts, newCompaniesCount: newCompanies.length, newCompanies, companiesInserted}, null, 1));
  await c.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
