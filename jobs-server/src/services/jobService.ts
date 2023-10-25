import { Prisma } from '@prisma/client';

import { env } from '../config/env';
import { NotFoundError } from '../errors/httpError';
import { JobPage, JobSummary, ListJobsOptions } from '../interfaces/job';
import { prisma } from '../lib/prisma';

const clampLimit = (limit?: number): number => {
  if (!limit || limit < 1) {
    return env.defaultPageSize;
  }

  return Math.min(limit, env.maxPageSize);
};

const buildWhere = (title?: string): Prisma.JobWhereInput =>
  title ? { title: { contains: title, mode: 'insensitive' } } : {};

/**
 * Newest-first page of job listings.
 *
 * Uses a cursor rather than an offset: `skip` makes Postgres walk and discard every
 * preceding row, so page 500 costs 500 pages of work. A cursor on the indexed
 * (createdAt, id) pair costs the same as page 1.
 *
 * `applicantCount` comes from a grouped aggregate and `hasApplied` from a single query
 * scoped to the caller, so listing N jobs is 3 queries rather than 1 + N.
 */
export const listJobs = async ({ userId, title, cursor, limit }: ListJobsOptions): Promise<JobPage> => {
  const take = clampLimit(limit);

  const jobs = await prisma.job.findMany({
    where: buildWhere(title),
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      title: true,
      description: true,
      experienceLevel: true,
      employmentType: true,
      createdAt: true,
    },
  });

  const hasMore = jobs.length > take;
  const page = hasMore ? jobs.slice(0, take) : jobs;
  const jobIds = page.map((job) => job.id);

  if (jobIds.length === 0) {
    return { jobs: [], nextCursor: null };
  }

  const [counts, myApplications] = await Promise.all([
    prisma.application.groupBy({
      by: ['jobId'],
      where: { jobId: { in: jobIds } },
      _count: { jobId: true },
    }),
    prisma.application.findMany({
      where: { userId, jobId: { in: jobIds } },
      select: { jobId: true },
    }),
  ]);

  const countByJob = new Map(counts.map((row) => [row.jobId, row._count.jobId]));
  const appliedJobIds = new Set(myApplications.map((row) => row.jobId));

  const summaries: JobSummary[] = page.map((job) => ({
    ...job,
    applicantCount: countByJob.get(job.id) ?? 0,
    hasApplied: appliedJobIds.has(job.id),
  }));

  return {
    jobs: summaries,
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
};

/**
 * Record an application. Idempotent: applying twice is a no-op rather than an error,
 * and the unique (userId, jobId) constraint makes a duplicate impossible even if two
 * requests race.
 */
export const applyToJob = async (userId: string, jobId: string): Promise<void> => {
  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } });

  if (!job) {
    throw new NotFoundError('Job not found');
  }

  try {
    await prisma.application.create({ data: { userId, jobId } });
  } catch (error) {
    // P2002 is the unique (userId, jobId) constraint: another request for the same user
    // and job won the race. That is the outcome we wanted, so report success.
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      throw error;
    }
  }
};
