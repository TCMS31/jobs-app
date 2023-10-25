import Cookies from 'js-cookie';

export interface Session {
  authtoken: string;
  userId: string;
  name: string;
}

const TOKEN_KEY = 'authtoken';
const USER_ID_KEY = 'userId';
const NAME_KEY = 'userName';
const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  sameSite: 'strict',
  expires: 7,
  secure: window.location.protocol === 'https:',
};

/**
 * The single source of truth for the signed-in session.
 *
 * Authentication state used to live in two places at once — a boolean in localStorage
 * and the token in a cookie — which could disagree: clearing the cookie left the app
 * convinced it was signed in, rendering a page whose every request then failed with 401.
 * Everything now derives from the token.
 */
export const authStorage = {
  read(): Session | null {
    const authtoken = Cookies.get(TOKEN_KEY);
    const userId = Cookies.get(USER_ID_KEY);

    if (!authtoken || !userId) {
      return null;
    }

    return { authtoken, userId, name: Cookies.get(NAME_KEY) ?? '' };
  },

  write(session: Session): void {
    Cookies.set(TOKEN_KEY, session.authtoken, COOKIE_OPTIONS);
    Cookies.set(USER_ID_KEY, session.userId, COOKIE_OPTIONS);
    Cookies.set(NAME_KEY, session.name, COOKIE_OPTIONS);
  },

  clear(): void {
    [TOKEN_KEY, USER_ID_KEY, NAME_KEY].forEach((key) => Cookies.remove(key));
  },

  token(): string | undefined {
    return Cookies.get(TOKEN_KEY);
  },
};
