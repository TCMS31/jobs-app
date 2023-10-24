import { number, object, string } from 'yup';

export const applyJobSchema = object({
  jobId: string().uuid('jobId must be a uuid').required(),
});

export const listJobsSchema = object({
  title: string().trim().max(120).optional(),
  cursor: string().uuid('cursor must be a uuid').optional(),
  limit: number().integer().min(1).optional(),
});
