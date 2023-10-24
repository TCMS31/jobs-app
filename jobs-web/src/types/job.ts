export type JobType = {
  id: string;
  title: string;
  description: string;
  experienceLevel: string;
  employmentType: string;
  createdAt: string;
  /** Whether the signed-in user has applied. The API never reveals who else has. */
  hasApplied: boolean;
  applicantCount: number;
};

export type JobPage = {
  jobs: JobType[];
  nextCursor: string | null;
};
