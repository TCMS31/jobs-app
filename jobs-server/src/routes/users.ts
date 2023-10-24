import express from 'express';

import { handleLogin, handleSignup } from '../controllers/users';
import exceptionHandler from '../helpers/exceptionHelper';

const router = express.Router();

router.post('/signup', exceptionHandler(handleSignup));
router.post('/login', exceptionHandler(handleLogin));

export default router;
