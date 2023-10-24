import { JobSeed } from '../interfaces/job';

/** Sample listings used by `prisma db seed` so a fresh checkout has something to show. */
export const JOBS: JobSeed[] = [
  {
    title: 'Senior Backend Engineer',
    description:
      'Own the billing and payments services behind a platform handling 40k orders a day. You will work in TypeScript and Postgres, care about correctness under concurrency, and be comfortable owning a service end to end.',
    experienceLevel: 'Senior',
    employmentType: 'Full-Time',
  },
  {
    title: 'Frontend Engineer, Design Systems',
    description:
      'Build and maintain the component library used by six product teams. React, TypeScript and a strong eye for accessibility. You will spend as much time on documentation and API design as on pixels.',
    experienceLevel: 'Mid-Level',
    employmentType: 'Full-Time',
  },
  {
    title: 'Platform Engineer (Kubernetes)',
    description:
      'Keep the deployment pipeline boring. Terraform, Kubernetes and Go, with a mandate to cut build times and make rollbacks a non-event. On-call is shared across the team, one week in six.',
    experienceLevel: 'Senior',
    employmentType: 'Full-Time',
  },
  {
    title: 'Junior Full-Stack Developer',
    description:
      'A first engineering role with real mentorship. You will ship small features across a Node and React codebase from week one, pair daily, and have a named mentor for your first six months.',
    experienceLevel: 'Entry-Level',
    employmentType: 'Full-Time',
  },
  {
    title: 'Data Engineer',
    description:
      'Move the analytics stack off nightly batch jobs and onto an incremental model. dbt, Airflow and Snowflake, working alongside two analysts who will be your first customers.',
    experienceLevel: 'Mid-Level',
    employmentType: 'Full-Time',
  },
  {
    title: 'Mobile Engineer (React Native)',
    description:
      'Take our React Native app from 3.8 to 4.5 stars. The roadmap is offline support, a rebuilt onboarding flow, and cutting cold-start time in half. iOS and Android, one shared codebase.',
    experienceLevel: 'Mid-Level',
    employmentType: 'Contract',
  },
  {
    title: 'Site Reliability Engineer',
    description:
      'Define the SLOs, then build the tooling that keeps us honest about them. Prometheus, Grafana and a lot of conversations with product teams about what "available" actually means.',
    experienceLevel: 'Senior',
    employmentType: 'Full-Time',
  },
  {
    title: 'QA Automation Engineer',
    description:
      'Replace a flaky Selenium suite with Playwright tests people trust. You will have the authority to delete tests that do not earn their runtime and to block releases that fail.',
    experienceLevel: 'Mid-Level',
    employmentType: 'Full-Time',
  },
  {
    title: 'Product Designer',
    description:
      'Lead design for the applicant-facing side of the product. Research, prototypes and production-ready Figma, working directly with two frontend engineers. Portfolio matters more than years.',
    experienceLevel: 'Mid-Level',
    employmentType: 'Full-Time',
  },
  {
    title: 'Technical Writer',
    description:
      'Own the public API documentation end to end. You will read code, run the requests yourself, and turn a sprawling wiki into something a developer can follow in an afternoon.',
    experienceLevel: 'Mid-Level',
    employmentType: 'Part-Time',
  },
  {
    title: 'Security Engineer',
    description:
      'Run the application security programme: threat modelling for new services, dependency and secret scanning in CI, and a quarterly external pentest you will scope and triage.',
    experienceLevel: 'Senior',
    employmentType: 'Full-Time',
  },
  {
    title: 'Engineering Manager',
    description:
      'Lead a team of six working on the core marketplace. We expect you to stay technical enough to review a design document, and to spend most of your time on people and prioritisation.',
    experienceLevel: 'Lead',
    employmentType: 'Full-Time',
  },
];
