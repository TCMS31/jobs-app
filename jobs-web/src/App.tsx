import { BrowserRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from 'contexts/AuthContext';

import { AppRouter } from 'components/AppRoutes/AppRouter';

import { theme } from './theme';

const App = (): JSX.Element => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;
