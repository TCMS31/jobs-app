import { authStorage } from 'services/authStorage';

describe('authStorage', () => {
  afterEach(() => authStorage.clear());

  it('returns null when nothing is stored', () => {
    expect(authStorage.read()).toBeNull();
  });

  it('round-trips a session', () => {
    authStorage.write({ authtoken: 'token', userId: 'user-1', name: 'Ada Okafor' });

    expect(authStorage.read()).toEqual({ authtoken: 'token', userId: 'user-1', name: 'Ada Okafor' });
  });

  it('treats a session with no token as signed out, so state cannot drift', () => {
    authStorage.write({ authtoken: 'token', userId: 'user-1', name: 'Ada Okafor' });
    document.cookie = 'authtoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

    expect(authStorage.read()).toBeNull();
  });

  it('clears every key on sign out', () => {
    authStorage.write({ authtoken: 'token', userId: 'user-1', name: 'Ada Okafor' });
    authStorage.clear();

    expect(authStorage.read()).toBeNull();
    expect(authStorage.token()).toBeUndefined();
  });
});
