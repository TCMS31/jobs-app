import { PropsWithChildren } from 'react';
import MuiContainer from '@mui/material/Container';

/** Narrow, vertically centred shell for the sign-in and sign-up screens. */
export const FormContainer = ({ children }: PropsWithChildren): JSX.Element => (
  <MuiContainer
    component="main"
    maxWidth="xs"
    sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    {children}
  </MuiContainer>
);
