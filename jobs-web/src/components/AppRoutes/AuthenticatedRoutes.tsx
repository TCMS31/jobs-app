import { Navigate, Route, Routes } from 'react-router-dom';
import { Jobs } from 'pages/Jobs/Jobs';

import { routes } from 'constants/routes';

export const AuthenticatedRoutes = (): JSX.Element => (
  <Routes>
    <Route path={routes.jobs} Component={Jobs} />
    <Route path="*" element={<Navigate to={routes.jobs} replace />} />
  </Routes>
);
