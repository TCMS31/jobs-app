import cors from 'cors';
import express, { Express } from 'express';
import logger from 'morgan';

import { env } from './config/env';
import routes from './routes/index';
import sendResponse from './helpers/responseHelper';
import RESPONSE_CODES from './constants/responseCodes';

/**
 * Builds the Express application without binding a port, so tests can drive it in
 * process. Binding lives in `server.ts`; importing this module previously started a
 * listener, which left the test runner hanging after the last assertion.
 */
export const createApp = (): Express => {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));

  if (process.env.NODE_ENV !== 'test') {
    app.use(logger('dev'));
  }

  app.use(express.json({ limit: '100kb' }));
  app.use('/api', routes);
  app.use((_req, res) => sendResponse(res, {}, 'Not found', RESPONSE_CODES.notFound));

  return app;
};

export const app = createApp();
