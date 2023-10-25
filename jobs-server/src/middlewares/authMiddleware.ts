import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import sendResponse from '../helpers/responseHelper';
import RESPONSE_CODES from '../constants/responseCodes';
import { AuthenticatedRequest } from '../interfaces/request';

interface TokenPayload {
  user: string;
}

const readToken = (req: Request): string | undefined => {
  const header = req.headers.authtoken;

  if (Array.isArray(header)) {
    return header[0];
  }

  if (header) {
    return header;
  }

  const authorization = req.headers.authorization;

  return authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : undefined;
};

const unauthorized = (res: Response): void =>
  sendResponse(res, {}, 'Unauthorized user', RESPONSE_CODES.authorizationError);

/**
 * Verifies the bearer token and attaches the caller's id to the request.
 *
 * The signing key comes from the validated config, so signing and verification can no
 * longer disagree — previously login fell back to a literal `'jwtsecret'` while this
 * middleware verified against `process.env.JWT_KEY`, which meant every protected route
 * rejected every freshly issued token whenever JWT_KEY was unset.
 */
const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = readToken(req);

  if (!token) {
    return unauthorized(res);
  }

  jwt.verify(token, env.jwtKey, (error, decoded) => {
    if (error || !decoded) {
      return unauthorized(res);
    }

    (req as AuthenticatedRequest).userId = (decoded as TokenPayload).user;
    next();
  });
};

export default authenticateToken;
