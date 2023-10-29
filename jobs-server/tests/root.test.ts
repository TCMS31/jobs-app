import { prisma } from '../src/lib/prisma';

// Runs once for the whole suite. Without it the Prisma connection pool keeps the event
// loop alive and mocha never exits — the behaviour that made `yarn test` hang.
after(async () => {
  await prisma.$disconnect();
});
