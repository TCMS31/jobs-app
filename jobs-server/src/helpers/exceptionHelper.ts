import { NextFunction, Request, RequestHandler, Response } from 'express';

import RESPONSE_CODES from '../constants/responseCodes';
import { HttpError } from '../errors/httpError';
import sendResponse from './responseHelper';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

const statusFor = (error: unknown): number => {
  if (error instanceof HttpError) {
    return error.status;
  }

  if (error instanceof Error && error.name === 'ValidationError') {
    return RESPONSE_CODES.badRequest;
  }

  return RESPONSE_CODES.serverError;
};

/**
 * Wraps an async handler so a rejected promise becomes a response instead of an
 * unhandled rejection. Unexpected failures are logged in full but reported to the client
 * as a generic message, so internal detail does not leak.
 */
const exceptionHandler =
  (executable: AsyncHandler): RequestHandler =>
  async (req, res, next) => {
    try {
      await executable(req, res, next);
    } catch (error) {
      const status = statusFor(error);

      if (status === RESPONSE_CODES.serverError) {
        console.error(error);
        sendResponse(res, {}, 'Something went wrong', status);

        return;
      }

      sendResponse(res, {}, error instanceof Error ? error.message : 'Request failed', status);
    }
  };

export default exceptionHandler;
