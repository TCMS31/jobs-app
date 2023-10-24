import { useContext } from 'react';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { AuthContext } from 'contexts/AuthContext';

export const Header = (): JSX.Element => {
  const { session, signOut } = useContext(AuthContext);

  return (
    <AppBar position="static" component="header">
      <Container maxWidth="md">
        <Toolbar disableGutters sx={{ gap: 2, minHeight: { xs: 60, sm: 68 } }}>
          <Typography
            component="span"
            sx={{ fontFamily: 'h1.fontFamily', fontSize: '1.375rem', fontWeight: 600, flexGrow: 1 }}
          >
            Jobs Board
          </Typography>

          {session && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, opacity: 0.85 }}>
                Signed in as {session.name || 'you'}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={signOut}
                sx={{ color: 'inherit', borderColor: 'rgba(246, 242, 234, 0.6)' }}
              >
                Sign out
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};
