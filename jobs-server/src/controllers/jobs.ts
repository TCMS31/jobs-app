import { Response } from 'express';

import sendResponse from '../helpers/responseHelper';
import { AuthenticatedRequest } from '../interfaces/request';
import { applyToJob, listJobs } from '../services/jobService';
import { applyJobSchema, listJobsSchema } from '../validationSchemas/jobsSchema';

export const getJobs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { title, cursor, limit } = await listJobsSchema.validate(req.query, { stripUnknown: true });

  const page = await listJobs({
    userId: req.userId as string,
    title: title || undefined,
    cursor,
    limit,
  });

  sendResponse(res, page);
};

export const applyToJobHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { jobId } = await applyJobSchema.validate(req.body, { stripUnknown: true });

  // The applicant is taken from the verified token, never from the request body, so a
  // caller cannot apply on somebody else's behalf by sending their id.
  await applyToJob(req.userId as string, jobId);

  sendResponse(res, { jobId, hasApplied: true });
};
