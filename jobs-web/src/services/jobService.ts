import { AxiosResponse } from 'axios';
import { JobPage } from 'types/job';

import { baseService } from './baseService';

export const jobApi = {
  jobs: '/jobs',
  applyToJob: '/jobs/apply',
};

export interface ListJobsParams {
  cursor?: string | null;
  limit?: number;
}

export function getJobs({ cursor, limit }: ListJobsParams = {}): Promise<AxiosResponse<{ payload: JobPage }>> {
  return baseService.get(jobApi.jobs, {
    params: { ...(cursor ? { cursor } : {}), ...(limit ? { limit } : {}) },
  });
}

export function applyToJob(jobId: string): Promise<AxiosResponse<{ payload: { jobId: string } }>> {
  return baseService.post(jobApi.applyToJob, { jobId });
}
