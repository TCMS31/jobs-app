import express from 'express';

import jobsRoutes from './jobs';
import authRoutes from './users';

const router = express.Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/jobs', jobsRoutes);

export default router;
