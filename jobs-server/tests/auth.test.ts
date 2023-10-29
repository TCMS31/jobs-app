import { expect } from 'chai';
import jwt from 'jsonwebtoken';

import { env } from '../src/config/env';
import RESPONSE_CODES from '../src/constants/responseCodes';
import { prisma } from '../src/lib/prisma';
import { api, uniqueEmail } from './helpers';

describe('POST /api/auth/signup', () => {
  it('creates a user when the payload is valid', async () => {
    const email = uniqueEmail('signup');

    await api()
      .post('/api/auth/signup')
      .send({ name: 'John Doe', email, password: 'abcd1234' })
      .expect(RESPONSE_CODES.ok);

    const created = await prisma.user.findUnique({ where: { email } });

    expect(created).to.not.equal(null);
  });

  it('never returns the password or its hash', async () => {
    const email = uniqueEmail('signup-leak');

    const response = await api()
      .post('/api/auth/signup')
      .send({ name: 'John Doe', email, password: 'abcd1234' })
      .expect(RESPONSE_CODES.ok);

    const stored = await prisma.user.findUniqueOrThrow({ where: { email } });
    const body = JSON.stringify(response.body);

    expect(body).to.not.include('abcd1234');
    expect(body).to.not.include(stored.password);
    expect(body).to.not.include('$2b$');
  });

  it('stores the password as a bcrypt hash, not plaintext', async () => {
    const email = uniqueEmail('signup-hash');

    await api()
      .post('/api/auth/signup')
      .send({ name: 'John Doe', email, password: 'abcd1234' })
      .expect(RESPONSE_CODES.ok);

    const stored = await prisma.user.findUniqueOrThrow({ where: { email } });

    expect(stored.password).to.not.equal('abcd1234');
    expect(stored.password).to.match(/^\$2[aby]\$/);
  });

  it('rejects a duplicate email', async () => {
    const email = uniqueEmail('duplicate');
    const payload = { name: 'John Doe', email, password: 'abcd1234' };

    await api().post('/api/auth/signup').send(payload).expect(RESPONSE_CODES.ok);

    const response = await api().post('/api/auth/signup').send(payload).expect(RESPONSE_CODES.conflictError);

    expect(response.body.message).to.equal('User already exists');
  });

  it('rejects a password shorter than eight characters', async () => {
    await api()
      .post('/api/auth/signup')
      .send({ name: 'John Doe', email: uniqueEmail('short'), password: 'abc' })
      .expect(RESPONSE_CODES.badRequest);
  });

  it('rejects a malformed email', async () => {
    await api()
      .post('/api/auth/signup')
      .send({ name: 'John Doe', email: 'not-an-email', password: 'abcd1234' })
      .expect(RESPONSE_CODES.badRequest);
  });
});

describe('POST /api/auth/login', () => {
  const email = uniqueEmail('login');
  const password = 'abcd1234';

  before(async () => {
    await api().post('/api/auth/signup').send({ name: 'John Doe', email, password }).expect(200);
  });

  it('returns a token that the server can verify', async () => {
    const response = await api().post('/api/auth/login').send({ email, password }).expect(RESPONSE_CODES.ok);

    const { authtoken, userId } = response.body.payload;

    expect(authtoken).to.be.a('string');

    const decoded = jwt.verify(authtoken, env.jwtKey) as { user: string };

    expect(decoded.user).to.equal(userId);
  });

  it('does not put the password or its hash in the token payload', async () => {
    const response = await api().post('/api/auth/login').send({ email, password }).expect(200);

    const decoded = jwt.decode(response.body.payload.authtoken) as Record<string, unknown>;

    expect(Object.keys(decoded)).to.have.members(['user', 'iat', 'exp']);
  });

  it('does not put the password or its hash in the response body', async () => {
    const response = await api().post('/api/auth/login').send({ email, password }).expect(200);
    const stored = await prisma.user.findUniqueOrThrow({ where: { email } });
    const body = JSON.stringify(response.body);

    expect(body).to.not.include(stored.password);
    expect(body).to.not.include('$2b$');
    expect(response.body.payload).to.not.have.property('password');
  });

  it('rejects an unknown email', async () => {
    const response = await api()
      .post('/api/auth/login')
      .send({ email: 'nobody@example.test', password })
      .expect(RESPONSE_CODES.authorizationError);

    expect(response.body.message).to.equal('Invalid email/password');
  });

  it('rejects a wrong password', async () => {
    const response = await api()
      .post('/api/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(RESPONSE_CODES.authorizationError);

    expect(response.body.message).to.equal('Invalid email/password');
  });

  it('gives the same message for an unknown email and a wrong password', async () => {
    const unknown = await api()
      .post('/api/auth/login')
      .send({ email: 'nobody@example.test', password })
      .expect(401);
    const wrong = await api().post('/api/auth/login').send({ email, password: 'nope1234' }).expect(401);

    expect(unknown.body.message).to.equal(wrong.body.message);
  });
});
