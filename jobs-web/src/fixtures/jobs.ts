import { JobType } from 'types/job';

/** Job listings used by the component tests, shaped exactly like the API response. */
export const mockedJobs: JobType[] = [
  {
    id: '6f603f74-0a32-4176-848b-94d2969014f1',
    title: 'Senior Backend Engineer',
    description: 'Own the billing and payments services behind a platform handling 40k orders a day.',
    experienceLevel: 'Senior',
    employmentType: 'Full-Time',
    createdAt: '2023-07-20T12:13:49.908Z',
    hasApplied: false,
    applicantCount: 4,
  },
  {
    id: '8bfce472-ad3e-431b-8f9c-8807a1e127e5',
    title: 'Frontend Engineer, Design Systems',
    description: 'Build and maintain the component library used by six product teams.',
    experienceLevel: 'Mid-Level',
    employmentType: 'Full-Time',
    createdAt: '2023-07-20T12:23:49.908Z',
    hasApplied: true,
    applicantCount: 11,
  },
  {
    id: '1f33b3ea-47f3-4bb3-851c-7f6327edf2e3',
    title: 'Platform Engineer (Kubernetes)',
    description: 'Keep the deployment pipeline boring. Terraform, Kubernetes and Go.',
    experienceLevel: 'Senior',
    employmentType: 'Contract',
    createdAt: '2023-07-20T12:33:49.908Z',
    hasApplied: false,
    applicantCount: 0,
  },
];

export const mockedJobPage = { jobs: mockedJobs, nextCursor: null };
