import { Request } from 'express';

/** A request that has passed through `authenticateToken`, so `userId` is populated. */
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export interface ResponseCodes {
  ok: number;
  created: number;
  badRequest: number;
  authorizationError: number;
  notFound: number;
  conflictError: number;
  serverError: number;
}
