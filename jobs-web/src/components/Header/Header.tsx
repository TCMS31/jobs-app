import { useContext } from 'react';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { AuthContext } from 'contexts/AuthContext';

export const Header = (): JSX.Element => {
  const { session, signOut } = useContext(AuthContext);

  return (
    <AppBar position="static" color="primary">
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 1.5 }}>
          <WorkOutlineIcon />
          <Typography variant="h6" component="span" sx={{ fontWeight: 700, letterSpacing: '.08rem', flexGrow: 1 }}>
            Jobs Board
          </Typography>

          {session && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, opacity: 0.85 }}>
                Signed in as {session.name || 'you'}
              </Typography>
              {/* Signing out was simply not implemented: there was no way to end a session. */}
              <Button color="inherit" variant="outlined" size="small" onClick={signOut}>
                Sign out
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};
