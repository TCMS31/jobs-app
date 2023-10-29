import axios from 'axios';

import { authStorage } from 'services/authStorage';
import { baseService, setUnauthorizedHandler } from 'services/baseService';

type Interceptor<T> = { onFulfilled: (value: T) => T; onRejected: (error: unknown) => Promise<never> };

interface MockedAxios {
  registeredInterceptors: {
    request: Interceptor<{ headers: Record<string, string> }>[];
    response: Interceptor<unknown>[];
  };
}

const interceptors = (axios as unknown as MockedAxios).registeredInterceptors;

describe('baseService', () => {
  beforeEach(() => {
    authStorage.clear();
    setUnauthorizedHandler(() => undefined);
  });

  afterEach(() => {
    authStorage.clear();
  });

  it('creates an instance', () => {
    expect(baseService).toBeDefined();
    expect(interceptors.request).toHaveLength(1);
    expect(interceptors.response).toHaveLength(1);
  });

  it('attaches the token that exists at request time, not at import time', () => {
    // The module was imported before any sign-in, which is exactly when the old code read
    // the cookie once and cached `undefined` into the instance defaults.
    const before = interceptors.request[0].onFulfilled({ headers: {} });

    expect(before.headers.authtoken).toBeUndefined();

    authStorage.write({ authtoken: 'token-issued-after-import', userId: 'user-1', name: 'Ada' });

    const after = interceptors.request[0].onFulfilled({ headers: {} });

    expect(after.headers.authtoken).toBe('token-issued-after-import');
  });

  it('picks up a token that changed since the previous request', () => {
    authStorage.write({ authtoken: 'first', userId: 'user-1', name: 'Ada' });
    expect(interceptors.request[0].onFulfilled({ headers: {} }).headers.authtoken).toBe('first');

    authStorage.write({ authtoken: 'second', userId: 'user-1', name: 'Ada' });
    expect(interceptors.request[0].onFulfilled({ headers: {} }).headers.authtoken).toBe('second');
  });

  it('clears the session and notifies the app when the API answers 401', async () => {
    authStorage.write({ authtoken: 'stale', userId: 'user-1', name: 'Ada' });

    const onUnauthorized = jest.fn();

    setUnauthorizedHandler(onUnauthorized);

    await expect(
      interceptors.response[0].onRejected({ isAxiosError: true, response: { status: 401 } })
    ).rejects.toBeDefined();

    expect(authStorage.read()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('leaves the session alone for a non-401 failure', async () => {
    authStorage.write({ authtoken: 'good', userId: 'user-1', name: 'Ada' });

    const onUnauthorized = jest.fn();

    setUnauthorizedHandler(onUnauthorized);

    await expect(
      interceptors.response[0].onRejected({ isAxiosError: true, response: { status: 500 } })
    ).rejects.toBeDefined();

    expect(authStorage.read()?.authtoken).toBe('good');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
