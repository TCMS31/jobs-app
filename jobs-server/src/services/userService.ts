import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { ConflictError, UnauthorizedError } from '../errors/httpError';
import { compareData, encryptData } from '../helpers/encryptionHelpers';
import { AuthSession, UserCredentials, UserRegistration } from '../interfaces/user';
import { prisma } from '../lib/prisma';

/**
 * The unique index on email is the only check: a look-up first would still let two
 * simultaneous sign-ups for one address both pass it, and the loser surfaced as a 500.
 */
export const registerUser = async ({ name, email, password }: UserRegistration): Promise<void> => {
  try {
    await prisma.user.create({
      data: { name, email, password: await encryptData(password) },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('User already exists');
    }

    throw error;
  }
};

/**
 * Exchange credentials for a signed token.
 *
 * The returned object is built field by field rather than spread from the user record,
 * so the password hash cannot reach a client by accident. The token payload carries the
 * user id only, for the same reason.
 */
export const authenticateUser = async ({ email, password }: UserCredentials): Promise<AuthSession> => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Compare against a dummy hash when the user is unknown so that a missing account and a
  // wrong password take the same amount of time and cannot be told apart by timing.
  const hash = user?.password ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';

  if (!(await compareData(password, hash)) || !user) {
    throw new UnauthorizedError('Invalid email/password');
  }

  return {
    authtoken: jwt.sign({ user: user.id }, env.jwtKey, { expiresIn: '7d' }),
    userId: user.id,
    name: user.name,
  };
};
