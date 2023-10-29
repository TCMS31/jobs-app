import { expect } from 'chai';
import jwt from 'jsonwebtoken';

import { env } from '../src/config/env';
import RESPONSE_CODES from '../src/constants/responseCodes';
import { prisma } from '../src/lib/prisma';
import { api, createJob, createUserAndLogin, TestUser } from './helpers';

describe('GET /api/jobs', () => {
  let alice: TestUser;

  before(async () => {
    alice = await createUserAndLogin('alice');

    // Enough rows for the paging assertions to be meaningful on an empty database: the
    // suite must not depend on `prisma db seed` having been run first.
    await createJob('Fixture Engineer');
    await createJob('Fixture Designer');
    await createJob('Fixture Analyst');
  });

  it('rejects a request with no token', async () => {
    const response = await api().get('/api/jobs').expect(RESPONSE_CODES.authorizationError);

    expect(response.body.message).to.equal('Unauthorized user');
  });

  it('rejects a token signed with a different key', async () => {
    const forged = jwt.sign({ user: alice.id }, 'not-the-real-signing-key');

    await api().get('/api/jobs').set('authtoken', forged).expect(RESPONSE_CODES.authorizationError);
  });

  it('rejects a structurally invalid token', async () => {
    await api()
      .get('/api/jobs')
      .set('authtoken', 'clearly.not.a.jwt')
      .expect(RESPONSE_CODES.authorizationError);
  });

  it('accepts the token as an Authorization: Bearer header too', async () => {
    await api().get('/api/jobs').set('Authorization', `Bearer ${alice.authtoken}`).expect(RESPONSE_CODES.ok);
  });

  it('returns a page of jobs for an authenticated caller', async () => {
    const response = await api().get('/api/jobs').set('authtoken', alice.authtoken).expect(200);

    expect(response.body.payload.jobs).to.be.an('array').with.lengthOf.above(0);
    expect(response.body.payload).to.have.property('nextCursor');
  });

  it('filters by title, case-insensitively', async () => {
    await createJob('Kubernetes Whisperer');

    const response = await api()
      .get('/api/jobs?title=kubernetes whisperer')
      .set('authtoken', alice.authtoken)
      .expect(200);

    const titles = response.body.payload.jobs.map((job: { title: string }) => job.title);

    expect(titles).to.include('Kubernetes Whisperer');
    expect(titles.every((title: string) => title.toLowerCase().includes('kubernetes'))).to.equal(true);
  });

  it('caps the page size at MAX_PAGE_SIZE however large a limit is requested', async () => {
    const response = await api().get('/api/jobs?limit=100000').set('authtoken', alice.authtoken).expect(200);

    expect(response.body.payload.jobs.length).to.be.at.most(env.maxPageSize);
  });

  it('pages through results with the cursor without repeating a job', async () => {
    const first = await api().get('/api/jobs?limit=2').set('authtoken', alice.authtoken).expect(200);

    expect(first.body.payload.jobs).to.have.lengthOf(2);
    expect(first.body.payload.nextCursor).to.be.a('string');

    const second = await api()
      .get(`/api/jobs?limit=2&cursor=${first.body.payload.nextCursor}`)
      .set('authtoken', alice.authtoken)
      .expect(200);

    const firstIds = first.body.payload.jobs.map((job: { id: string }) => job.id);
    const secondIds = second.body.payload.jobs.map((job: { id: string }) => job.id);

    expect(firstIds.some((id: string) => secondIds.includes(id))).to.equal(false);
  });

  it('rejects a cursor that is not a uuid', async () => {
    await api()
      .get('/api/jobs?cursor=not-a-uuid')
      .set('authtoken', alice.authtoken)
      .expect(RESPONSE_CODES.badRequest);
  });
});

describe('POST /api/jobs/apply', () => {
  let alice: TestUser;
  let bob: TestUser;
  let jobId: string;

  beforeEach(async () => {
    alice = await createUserAndLogin('apply-alice');
    bob = await createUserAndLogin('apply-bob');
    jobId = (await createJob('Applications Fixture')).id;
  });

  it('rejects an unauthenticated application', async () => {
    await api().post('/api/jobs/apply').send({ jobId }).expect(RESPONSE_CODES.authorizationError);

    expect(await prisma.application.count({ where: { jobId } })).to.equal(0);
  });

  it('records the application and reflects it in the listing', async () => {
    await api()
      .post('/api/jobs/apply')
      .set('authtoken', alice.authtoken)
      .send({ jobId })
      .expect(RESPONSE_CODES.ok);

    const response = await api()
      .get('/api/jobs?title=Applications Fixture')
      .set('authtoken', alice.authtoken)
      .expect(200);

    const job = response.body.payload.jobs.find((entry: { id: string }) => entry.id === jobId);

    expect(job.hasApplied).to.equal(true);
    expect(job.applicantCount).to.equal(1);
  });

  it('is idempotent: applying twice leaves exactly one application', async () => {
    await api().post('/api/jobs/apply').set('authtoken', alice.authtoken).send({ jobId }).expect(200);
    await api().post('/api/jobs/apply').set('authtoken', alice.authtoken).send({ jobId }).expect(200);

    expect(await prisma.application.count({ where: { jobId, userId: alice.id } })).to.equal(1);
  });

  it('survives concurrent applications from the same user without duplicating', async () => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        api().post('/api/jobs/apply').set('authtoken', alice.authtoken).send({ jobId })
      )
    );

    // Every racing request must succeed, not just leave the database consistent: a 500
    // from the loser of the race is still a bug the user would see.
    expect(responses.map((response) => response.status)).to.deep.equal([200, 200, 200, 200, 200]);
    expect(await prisma.application.count({ where: { jobId, userId: alice.id } })).to.equal(1);
  });

  it('attributes the application to the token holder, ignoring a userId in the body', async () => {
    await api()
      .post('/api/jobs/apply')
      .set('authtoken', alice.authtoken)
      .send({ jobId, userId: bob.id })
      .expect(200);

    expect(await prisma.application.count({ where: { jobId, userId: bob.id } })).to.equal(0);
    expect(await prisma.application.count({ where: { jobId, userId: alice.id } })).to.equal(1);
  });

  it('does not mark a job as applied for a user who did not apply', async () => {
    await api().post('/api/jobs/apply').set('authtoken', alice.authtoken).send({ jobId }).expect(200);

    const response = await api()
      .get('/api/jobs?title=Applications Fixture')
      .set('authtoken', bob.authtoken)
      .expect(200);

    const job = response.body.payload.jobs.find((entry: { id: string }) => entry.id === jobId);

    expect(job.hasApplied).to.equal(false);
  });

  it('never discloses which users applied to a job', async () => {
    await api().post('/api/jobs/apply').set('authtoken', alice.authtoken).send({ jobId }).expect(200);

    const response = await api().get('/api/jobs').set('authtoken', bob.authtoken).expect(200);
    const body = JSON.stringify(response.body);

    expect(body).to.not.include(alice.id);
    expect(response.body.payload.jobs[0]).to.not.have.property('applications');
    expect(response.body.payload.jobs[0]).to.not.have.property('applicantIds');
  });

  it('returns 404 for a job that does not exist', async () => {
    const response = await api()
      .post('/api/jobs/apply')
      .set('authtoken', alice.authtoken)
      .send({ jobId: '00000000-0000-4000-8000-000000000000' })
      .expect(RESPONSE_CODES.notFound);

    expect(response.body.message).to.equal('Job not found');
  });

  it('rejects a jobId that is not a uuid', async () => {
    await api()
      .post('/api/jobs/apply')
      .set('authtoken', alice.authtoken)
      .send({ jobId: 'nope' })
      .expect(RESPONSE_CODES.badRequest);
  });
});

describe('unknown routes', () => {
  it('returns 404 rather than hanging', async () => {
    const response = await api().get('/api/does-not-exist').expect(RESPONSE_CODES.notFound);

    expect(response.body.message).to.equal('Not found');
  });
});
