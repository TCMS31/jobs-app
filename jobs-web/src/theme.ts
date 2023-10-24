import { createTheme } from '@mui/material/styles';

const ink = '#1f1d18';
const paper = '#f6f2ea';
const rule = '#ddd5c6';
const pine = '#1d5c4a';
const serif = "'Source Serif 4', Georgia, 'Times New Roman', serif";
const sans = "'Public Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";

/**
 * A noticeboard look: warm paper, near-black ink and a single pine-green accent for the
 * one action the app offers. Every foreground/background pair here clears WCAG AA.
 */
export const theme = createTheme({
  palette: {
    primary: { main: pine, dark: '#144437', contrastText: '#ffffff' },
    secondary: { main: '#8a4b14', contrastText: '#ffffff' },
    background: { default: paper, paper: '#fffdf8' },
    text: { primary: ink, secondary: '#5b554a' },
    divider: rule,
    error: { main: '#a3271b' },
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: sans,
    h1: { fontFamily: serif, fontSize: '2.25rem', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.01em' },
    h2: { fontFamily: serif, fontSize: '1.375rem', fontWeight: 600, lineHeight: 1.25 },
    h5: { fontFamily: serif, fontWeight: 600 },
    overline: { fontWeight: 600, letterSpacing: '0.12em' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          '&.Mui-focusVisible': { outline: `3px solid ${pine}`, outlineOffset: 2 },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: pine,
          fontWeight: 600,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          '&:focus-visible': { outline: `3px solid ${pine}`, outlineOffset: 2, borderRadius: 2 },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 4, fontWeight: 500 },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundColor: ink, color: paper } },
    },
  },
});
