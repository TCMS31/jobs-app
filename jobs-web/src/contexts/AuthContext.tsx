import { createContext, PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';

import { authStorage, Session } from 'services/authStorage';
import { setUnauthorizedHandler } from 'services/baseService';

interface AuthContextType {
  session: Session | null;
  isAuthenticated: boolean;
  signIn: (session: Session) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isAuthenticated: false,
  signIn: () => undefined,
  signOut: () => undefined,
});
const AuthProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [session, setSession] = useState<Session | null>(() => authStorage.read());
  const signIn = useCallback((next: Session) => {
    authStorage.write(next);
    setSession(next);
  }, []);
  const signOut = useCallback(() => {
    authStorage.clear();
    setSession(null);
  }, []);

  // A 401 from any request means the stored token is no longer good. Dropping the session
  // here is what keeps the UI and the credential from drifting apart.
  useEffect(() => {
    setUnauthorizedHandler(() => setSession(null));

    return () => setUnauthorizedHandler(() => undefined);
  }, []);

  const value = useMemo(
    () => ({ session, isAuthenticated: session !== null, signIn, signOut }),
    [session, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
