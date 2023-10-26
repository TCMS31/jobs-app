import { Request, Response } from 'express';

import sendResponse from '../helpers/responseHelper';
import { authenticateUser, registerUser } from '../services/userService';
import { userAuthSchema, userRegistrationSchema } from '../validationSchemas/userSchema';

export const handleSignup = async (req: Request, res: Response): Promise<void> => {
  const payload = await userRegistrationSchema.validate(req.body, { stripUnknown: true });

  await registerUser(payload);

  sendResponse(res);
};

export const handleLogin = async (req: Request, res: Response): Promise<void> => {
  const credentials = await userAuthSchema.validate(req.body, { stripUnknown: true });

  const session = await authenticateUser(credentials);

  sendResponse(res, session);
};
