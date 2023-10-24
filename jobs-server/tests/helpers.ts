import supertest from 'supertest';

import { app } from '../src/app';
import { encryptData } from '../src/helpers/encryptionHelpers';
import { prisma } from '../src/lib/prisma';

export const api = (): supertest.SuperTest<supertest.Test> => supertest(app);

export const uniqueEmail = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;

export interface TestUser {
  id: string;
  email: string;
  password: string;
  authtoken: string;
}

/** Creates a user directly and logs in through the API to obtain a real token. */
export const createUserAndLogin = async (prefix: string): Promise<TestUser> => {
  const email = uniqueEmail(prefix);
  const password = 'abcd1234';

  const user = await prisma.user.create({
    data: { name: 'Test User', email, password: encryptData(password) },
  });

  const response = await api().post('/api/auth/login').send({ email, password }).expect(200);

  return { id: user.id, email, password, authtoken: response.body.payload.authtoken };
};

export const createJob = (title: string) =>
  prisma.job.create({
    data: {
      title,
      description: 'Seeded by the test suite.',
      experienceLevel: 'Mid-Level',
      employmentType: 'Full-Time',
    },
  });
