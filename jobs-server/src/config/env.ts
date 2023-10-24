import 'dotenv/config';

const required = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env and fill it in.`
    );
  }

  return value;
};

const optionalNumber = (name: string, fallback: number): number => {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer, got "${raw}".`);
  }

  return parsed;
};

/**
 * Validated configuration. Reading this module throws at boot rather than letting the
 * process start with, for example, an unset JWT_KEY — which previously produced a server
 * that signed tokens with one secret and verified them against `undefined`.
 */
export const env = {
  port: optionalNumber('PORT', 8080),
  jwtKey: required('JWT_KEY'),
  corsOrigin: process.env.REACT_APP_URL ?? 'http://localhost:3000',
  defaultPageSize: optionalNumber('DEFAULT_PAGE_SIZE', 20),
  maxPageSize: optionalNumber('MAX_PAGE_SIZE', 100),
};
