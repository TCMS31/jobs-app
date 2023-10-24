import RESPONSE_CODES from '../constants/responseCodes';

/** An error carrying the status code the client should see. */
export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(message, RESPONSE_CODES.conflictError);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string) {
    super(message, RESPONSE_CODES.authorizationError);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(message, RESPONSE_CODES.notFound);
    this.name = 'NotFoundError';
  }
}
