import axios, { AxiosInstance } from 'axios';

import { authStorage } from './authStorage';

/** Notified when the API rejects the stored token, so the app can return to sign-in. */
type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler = () => undefined;

export const setUnauthorizedHandler = (handler: UnauthorizedHandler): void => {
  onUnauthorized = handler;
};

const apiService = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'Content-Type': 'application/json',
    },
  });

  // Read per request: at import time nobody has signed in yet, so a token captured in the
  // instance defaults would be `undefined` for the rest of the session.
  instance.interceptors.request.use((config) => {
    const token = authStorage.token();

    if (token) {
      config.headers.authtoken = token;
    }

    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        authStorage.clear();
        onUnauthorized();
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export const baseService = apiService();
