import { Navigate, Route, Routes } from 'react-router-dom';
import { Signin } from 'pages/Signin/Signin';
import { Signup } from 'pages/Signup/Signup';

import { routes } from 'constants/routes';

export const UnauthenticatedRoutes = (): JSX.Element => (
  <Routes>
    <Route path={routes.signup} Component={Signup} />
    <Route path={routes.signin} Component={Signin} />
    <Route path="*" element={<Navigate to={routes.signin} replace />} />
  </Routes>
);
