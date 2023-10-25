import { PrismaClient } from '@prisma/client';

/**
 * One client for the whole process. Each `new PrismaClient()` opens its own connection
 * pool, so the previous three instances (two controllers plus a helper) held three pools
 * against the same database.
 */
export const prisma = new PrismaClient();
