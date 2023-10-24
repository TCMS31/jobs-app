import { PrismaClient } from '@prisma/client';

/** One client for the whole process: each `new PrismaClient()` opens its own pool. */
export const prisma = new PrismaClient();
