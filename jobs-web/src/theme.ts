import { createTheme } from '@mui/material/styles';

/**
 * One theme for the whole app. Each screen used to create its own MUI theme (or none at
 * all), so the sign-in pages and the jobs list did not share a palette or type scale.
 */
export const theme = createTheme({
  palette: {
    primary: { main: '#1f3a5f' },
    secondary: { main: '#3f8f6f' },
    background: { default: '#f5f7fa', paper: '#ffffff' },
    text: { primary: '#16202e', secondary: '#5a6a7e' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "'Roboto', 'Segoe UI', system-ui, sans-serif",
    h1: { fontSize: '1.75rem', fontWeight: 600 },
    h2: { fontSize: '1.375rem', fontWeight: 600 },
    subtitle2: { fontWeight: 500 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
    },
    MuiCard: {
      styleOverrides: {
        root: { border: '1px solid #e3e8ef', boxShadow: 'none' },
      },
    },
  },
});
