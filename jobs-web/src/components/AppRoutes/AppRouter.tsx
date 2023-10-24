import { useContext } from 'react';
import { AuthContext } from 'contexts/AuthContext';

import { AuthenticatedRoutes } from './AuthenticatedRoutes';
import { UnauthenticatedRoutes } from './UnauthenticatedRoutes';

export const AppRouter = (): JSX.Element => {
  const { isAuthenticated } = useContext(AuthContext);

  if (isAuthenticated) {
    return <AuthenticatedRoutes />;
  }

  return <UnauthenticatedRoutes />;
};
