/**
 * Measures the cost of the job listing endpoint and compares it with the shape this
 * project used to have, where every job row carried a TEXT[] of every applicant's id and
 * the endpoint returned all rows with no paging.
 *
 * Usage (against a throwaway database):
 *   DATABASE_URL=postgresql://user@localhost:5432/jobs-db-bench yarn ts-node scripts/benchmarkListing.ts
 *
 * The script creates its own fixtures, prints a table, and leaves the data in place so a
 * run can be repeated. Point it at a database you are happy to fill with junk.
 */
import http from 'http';

import { env } from '../src/config/env';
import { prisma } from '../src/lib/prisma';

const RUNS = 15;
const JOBS = 500;
const USERS = 200;
const APPLICANTS_PER_JOB = 50;

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);

  return sorted[Math.floor(sorted.length / 2)];
};

const timed = async <T>(work: () => Promise<T>): Promise<[T, number]> => {
  const started = process.hrtime.bigint();
  const result = await work();

  return [result, Number(process.hrtime.bigint() - started) / 1e6];
};

const request = (
  path: string,
  method: 'GET' | 'POST',
  headers: Record<string, string>,
  body?: unknown
): Promise<{ ms: number; bytes: number; status: number; json: Record<string, never> }> =>
  new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const started = process.hrtime.bigint();
    const req = http.request(
      {
        host: 'localhost',
        port: env.port,
        path,
        method,
        headers: payload
          ? { ...headers, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
          : headers,
      },
      (res) => {
        let raw = '';
        let bytes = 0;

        res.on('data', (chunk: Buffer) => {
          bytes += chunk.length;
          raw += chunk.toString();
        });
        res.on('end', () =>
          resolve({
            ms: Number(process.hrtime.bigint() - started) / 1e6,
            bytes,
            status: res.statusCode ?? 0,
            json: raw ? JSON.parse(raw) : {},
          })
        );
      }
    );

    req.on('error', reject);
    req.end(payload);
  });

const seed = async (): Promise<void> => {
  const existing = await prisma.job.count();

  if (existing >= JOBS) {
    console.log(`Fixtures already present (${existing} jobs), reusing them.`);

    return;
  }

  console.log('Building fixtures, this takes a moment…');
  await prisma.$executeRawUnsafe(`
    INSERT INTO "Job" ("id","title","description","experienceLevel","employmentType","createdAt","updatedAt")
    SELECT gen_random_uuid()::text, 'Engineer role ' || g,
           repeat('Own the billing and payments services behind a platform handling 40k orders a day. ', 2),
           (ARRAY['Entry-Level','Mid-Level','Senior','Lead'])[1 + (g % 4)],
           (ARRAY['Full-Time','Part-Time','Contract'])[1 + (g % 3)],
           now() - (g || ' minutes')::interval, now()
    FROM generate_series(1,${JOBS}) g;
  `);
  await prisma.$executeRawUnsafe(`
    INSERT INTO "User" ("id","email","name","password","createdAt")
    SELECT gen_random_uuid()::text, 'bench' || g || '@example.test', 'Bench User ' || g,
           '$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012', now()
    FROM generate_series(1,${USERS}) g;
  `);
  await prisma.$executeRawUnsafe(`
    INSERT INTO "Application" ("id","userId","jobId","createdAt")
    SELECT gen_random_uuid()::text, u.id, j.id, now()
    FROM "Job" j
    CROSS JOIN LATERAL (SELECT id FROM "User" ORDER BY md5(id || j.id) LIMIT ${APPLICANTS_PER_JOB}) u
    ON CONFLICT DO NOTHING;
  `);

  // A copy of the previous schema, so "before" is measured rather than estimated.
  // One statement per call: Postgres rejects multiple commands in a prepared statement.
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "JobOld";');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "JobOld" AS
    SELECT j.id, j.title, j.description, j."experienceLevel", j."employmentType",
           COALESCE(a.ids, ARRAY[]::text[]) AS applications, j."createdAt", j."updatedAt"
    FROM "Job" j
    LEFT JOIN (SELECT "jobId", array_agg("userId") AS ids FROM "Application" GROUP BY "jobId") a
      ON a."jobId" = j.id;
  `);
  await prisma.$executeRawUnsafe('ANALYZE;');
};

const main = async (): Promise<void> => {
  await seed();

  const [jobs, users, applications] = await Promise.all([
    prisma.job.count(),
    prisma.user.count(),
    prisma.application.count(),
  ]);

  // BEFORE: every row, every column, every applicant id.
  const oldTimes: number[] = [];
  let oldBytes = 0;

  for (let run = 0; run < RUNS; run += 1) {
    const [rows, ms] = await timed(() =>
      prisma.$queryRawUnsafe<unknown[]>(
        'SELECT "id","title","description","experienceLevel","employmentType","applications","createdAt","updatedAt" FROM "JobOld"'
      )
    );

    oldTimes.push(ms);
    oldBytes = Buffer.byteLength(JSON.stringify({ payload: rows }));
  }

  // AFTER: one page over HTTP, through the running API.
  const email = `bench-caller-${Date.now()}@example.test`;

  await request('/api/auth/signup', 'POST', {}, { name: 'Bench Caller', email, password: 'abcd1234' });

  const login = await request('/api/auth/login', 'POST', {}, { email, password: 'abcd1234' });
  const authtoken = (login.json as unknown as { payload: { authtoken: string } }).payload.authtoken;

  const httpTimes: number[] = [];
  let httpBytes = 0;

  for (let run = 0; run < RUNS; run += 1) {
    const response = await request('/api/jobs', 'GET', { authtoken });

    if (response.status !== 200) {
      throw new Error(`GET /api/jobs returned ${response.status}; is the API running on port ${env.port}?`);
    }

    httpTimes.push(response.ms);
    httpBytes = response.bytes;
  }

  const rows: [string, string][] = [
    ['Dataset', `${jobs} jobs, ${users} users, ${applications} applications`],
    ['Runs per measurement (median reported)', String(RUNS)],
    ['BEFORE  listing query, all rows + applicant arrays', `${median(oldTimes).toFixed(1)} ms`],
    ['BEFORE  JSON response size', `${(oldBytes / 1024).toFixed(1)} KiB`],
    ['BEFORE  applicant ids disclosed to the caller', String(applications)],
    ['AFTER   GET /api/jobs over HTTP, one page of 20', `${median(httpTimes).toFixed(1)} ms`],
    ['AFTER   HTTP response size', `${(httpBytes / 1024).toFixed(1)} KiB`],
    ['AFTER   applicant ids disclosed to the caller', '0'],
  ];

  console.log(`\n${rows.map(([label, value]) => label.padEnd(52) + value).join('\n')}\n`);
};

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
