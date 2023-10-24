/** A job listing as it is seeded, before the database assigns identity/timestamps. */
export interface JobSeed {
  title: string;
  description: string;
  experienceLevel: string;
  employmentType: string;
}

/** A job listing as it is returned to a client. `applicantIds` is deliberately absent. */
export interface JobSummary {
  id: string;
  title: string;
  description: string;
  experienceLevel: string;
  employmentType: string;
  createdAt: Date;
  applicantCount: number;
  hasApplied: boolean;
}

export interface JobPage {
  jobs: JobSummary[];
  nextCursor: string | null;
}

export interface ListJobsOptions {
  userId: string;
  title?: string;
  cursor?: string;
  limit?: number;
}
