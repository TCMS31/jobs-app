import { AxiosResponse } from 'axios';
import { ApiError } from 'types/apiError';
import { SigninPayload, SigninResponse } from 'types/signin';
import { SignupPayload } from 'types/signupPayload';

import { baseService } from './baseService';

export const authApi = {
  login: '/auth/login',
  signup: '/auth/signup',
};

export function login(values: SigninPayload): Promise<AxiosResponse<SigninResponse, ApiError>> {
  return baseService.post(authApi.login, values);
}

export function signup(values: SignupPayload): Promise<AxiosResponse<void, ApiError>> {
  return baseService.post(authApi.signup, values);
}
