import { encryptData } from '../src/helpers/encryptionHelpers';
import { JOBS } from '../src/constants/jobs';
import { prisma } from '../src/lib/prisma';
import { UserRegistration } from '../src/interfaces/user';

const USERS: UserRegistration[] = [
  { name: 'John Doe', email: 'johndoe@example.com', password: 'abcd1234' },
  { name: 'Ada Okafor', email: 'ada@example.com', password: 'abcd1234' },
  { name: 'Marta Ruiz', email: 'marta@example.com', password: 'abcd1234' },
  { name: 'Tom Byrne', email: 'tom@example.com', password: 'abcd1234' },
  { name: 'Priya Nair', email: 'priya@example.com', password: 'abcd1234' },
  { name: 'Sam Lindqvist', email: 'sam@example.com', password: 'abcd1234' },
];

/**
 * How many of the seeded users have applied to each job, by job title, so the listing
 * shows a spread of applicant counts rather than a wall of zeros. The first entry of each
 * list is the demo account, which is what gives the UI its "Applied" state.
 */
const APPLICANTS_BY_TITLE: Record<string, string[]> = {
  'Engineering Manager': ['johndoe@example.com', 'ada@example.com', 'marta@example.com'],
  'Technical Writer': ['johndoe@example.com', 'priya@example.com'],
  'Security Engineer': ['ada@example.com', 'tom@example.com', 'priya@example.com', 'sam@example.com'],
  'Product Designer': ['marta@example.com'],
  'QA Automation Engineer': ['tom@example.com', 'sam@example.com'],
  'Site Reliability Engineer': ['priya@example.com', 'ada@example.com', 'sam@example.com'],
  'Senior Backend Engineer': [
    'johndoe@example.com',
    'tom@example.com',
    'marta@example.com',
    'ada@example.com',
  ],
  'Data Engineer': ['johndoe@example.com', 'sam@example.com'],
};

const seedUsers = async (): Promise<void> => {
  await Promise.all(
    USERS.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: { ...user, password: encryptData(user.password) },
      })
    )
  );
  console.log(`Seeded ${USERS.length} users`);
};

const seedJobs = async (): Promise<void> => {
  const existing = await prisma.job.count();

  if (existing > 0) {
    console.log(`Skipped job seeding, ${existing} jobs already present`);

    return;
  }

  // Explicit, staggered timestamps rather than relying on insertion order: several rows
  // otherwise land in the same millisecond and the newest-first listing is then arbitrary.
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  for (const [index, job] of JOBS.entries()) {
    await prisma.job.create({
      data: { ...job, createdAt: new Date(now - (JOBS.length - index) * oneDay) },
    });
  }
  console.log(`Seeded ${JOBS.length} jobs`);
};

const seedApplications = async (): Promise<void> => {
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const idByEmail = new Map(users.map((user) => [user.email, user.id]));
  const jobs = await prisma.job.findMany({ select: { id: true, title: true } });

  const rows = jobs.flatMap((job) =>
    (APPLICANTS_BY_TITLE[job.title] ?? [])
      .map((email) => idByEmail.get(email))
      .filter((userId): userId is string => Boolean(userId))
      .map((userId) => ({ userId, jobId: job.id }))
  );

  const created = await prisma.application.createMany({ data: rows, skipDuplicates: true });

  console.log(`Seeded ${created.count} applications across ${jobs.length} jobs`);
};

const main = async (): Promise<void> => {
  await seedUsers();
  await seedJobs();
  await seedApplications();
  console.log('Seeding finished.');
};

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
