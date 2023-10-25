import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { ConflictError, UnauthorizedError } from '../errors/httpError';
import { compareData, encryptData } from '../helpers/encryptionHelpers';
import { AuthSession, UserCredentials, UserRegistration } from '../interfaces/user';
import { prisma } from '../lib/prisma';

export const registerUser = async ({ name, email, password }: UserRegistration): Promise<void> => {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (existing) {
    throw new ConflictError('User already exists');
  }

  await prisma.user.create({
    data: { name, email, password: encryptData(password) },
  });
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

  if (!compareData(password, hash) || !user) {
    throw new UnauthorizedError('Invalid email/password');
  }

  return {
    authtoken: jwt.sign({ user: user.id }, env.jwtKey, { expiresIn: '7d' }),
    userId: user.id,
    name: user.name,
  };
};
