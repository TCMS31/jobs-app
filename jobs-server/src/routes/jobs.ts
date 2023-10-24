import express from 'express';

import { applyToJobHandler, getJobs } from '../controllers/jobs';
import exceptionHandler from '../helpers/exceptionHelper';
import authenticateToken from '../middlewares/authMiddleware';

const router = express.Router();

router.use(authenticateToken);
router.get('/', exceptionHandler(getJobs));
router.post('/apply', exceptionHandler(applyToJobHandler));

export default router;
