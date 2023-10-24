import { SigninPayload } from './signin';

export type SignupPayload = {
  name: string;
} & SigninPayload;
