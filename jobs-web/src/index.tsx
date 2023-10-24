import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';

import './index.scss';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
const App = React.lazy(() => import('./App'));

root.render(
  <React.StrictMode>
    <Suspense fallback={null}>
      <App />
    </Suspense>
  </React.StrictMode>
);
