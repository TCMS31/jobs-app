import { object, string } from 'yup';

export const userRegistrationSchema = object({
  name: string().trim().required().min(3).max(80),
  email: string().trim().lowercase().email().required().nonNullable(),
  password: string().min(8).max(72).required(),
});

export const userAuthSchema = object({
  email: string().trim().lowercase().email().required().nonNullable(),
  password: string().required().nonNullable(),
});
