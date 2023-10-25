import { Response } from 'express';

import RESPONSE_CODES from '../constants/responseCodes';

/**
 * Single response envelope for the whole API: `{ payload }` on success,
 * `{ payload: {}, message }` on failure.
 */
const sendResponse = (
  res: Response,
  data?: unknown,
  error?: string | null,
  responseCode?: number | null
): void => {
  if (error) {
    res.status(responseCode || RESPONSE_CODES.serverError).json({ payload: {}, message: error });

    return;
  }

  res.status(responseCode || RESPONSE_CODES.ok).json({ payload: data ?? {} });
};

export default sendResponse;
