const { Client } = require(process.env.PG_MODULE);
const c = new Client({ connectionString: process.env.PG_CONN });

async function run() {
  await c.connect();

  // PROMOTE: Roche Lead Controls & Finance Enablement
  let r = await c.query(
    "INSERT INTO job_applications (job_title,company,source,location,salary,priority,cv_approach,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,user_profile) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id",
    [
      'Lead Controls & Finance Enablement (d/f/m)',
      'Roche',
      'LinkedIn',
      'Meylan (38) — to confirm',
      null, 'A', 'hof-en', 'To Apply', '2026-06-03',
      'Not available', null,
      JSON.stringify([]),
      JSON.stringify(['Salary', 'Location confirmed', 'Hybrid policy']),
      'LinkedIn',
      'Roche Diagnostics Meylan assumed (Green zone). Lead Controls & Finance Enablement — senior finance transformation/controlling. English JD. (d/f/m) notation — confirm France vs. Basel posting.',
      true, 'zberlo'
    ]
  );
  console.log('ROCHE_LEAD_CONTROLS id:' + r.rows[0].id);

  // PROMOTE: Roche Finance Excellence Partner
  r = await c.query(
    "INSERT INTO job_applications (job_title,company,source,location,salary,priority,cv_approach,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,user_profile) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id",
    [
      'Finance Excellence Partner (d/f/m)',
      'Roche',
      'LinkedIn',
      'Meylan (38) — to confirm',
      null, 'A', 'fpa-en', 'To Apply', '2026-06-03',
      'Not available', null,
      JSON.stringify([]),
      JSON.stringify(['Salary', 'Location confirmed', 'Hybrid policy']),
      'LinkedIn',
      'Roche Diagnostics Meylan assumed (Green zone). Finance Excellence Partner — senior FP&A/business partner. English JD. (d/f/m) notation — confirm France vs. Basel posting.',
      true, 'zberlo'
    ]
  );
  console.log('ROCHE_FINANCE_PARTNER id:' + r.rows[0].id);

  // Mark Roche rows promoted in review_queue
  await c.query(
    "UPDATE review_queue SET status='To Apply — PROMOTED Jun 10', notes=notes||' — PROMOTED Jun 10 to job_applications' WHERE id=ANY($1) AND user_profile='zberlo'",
    [[405, 407]]
  );
  console.log('Roche review_queue rows promoted');

  // DISMISS 15 clear cases — update review_queue only
  const dismissals = [
    [441, 'OPERATIONAL — project director, not finance'],
    [409, 'OPERATIONAL — industrial procurement, non-finance'],
    [406, 'OPERATIONAL — supply chain PM, non-finance'],
    [413, 'IT/OPERATIONAL — ERP project management, not finance'],
    [421, 'FREELANCE — portage platform, not CDI'],
    [437, 'CONFIRMED — disability/youth coordinator €29K'],
    [410, 'ACCOUNTING FIRM — cabinet/agency, not in-house finance'],
    [436, 'SALARY — max €60K below €52K hard floor; temp agency'],
    [442, 'PUBLIC SECTOR — catégorie A civil servant scale €32-40K'],
    [408, 'LOCATION — COURIR Paris HQ; AR role not senior finance'],
    [419, 'NO INFO — employer/location/JD completely unknown'],
    [414, 'NO INFO — agency, employer/location/salary unknown'],
    [388, 'UNREADABLE — no usable information'],
    [440, 'TOO JUNIOR — general accountant, below seniority level'],
    [387, 'PUBLIC SECTOR — civil servant salary scale ~€35-42K'],
  ];

  for (const [id, reason] of dismissals) {
    await c.query(
      "UPDATE review_queue SET status='Dismissed', notes=COALESCE(notes,'')||$1 WHERE id=$2 AND user_profile='zberlo'",
      [' — DISMISSED Jun 10: ' + reason, id]
    );
  }
  console.log('Dismissed 15 rows');

  await c.end();
  console.log('DONE');
}

run().catch(e => { console.error(e.message); process.exit(1); });
