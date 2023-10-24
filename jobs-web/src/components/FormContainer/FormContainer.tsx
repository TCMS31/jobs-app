import { PropsWithChildren } from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface Props {
  title: string;
  intro: string;
}

/** Shared shell for sign-in and sign-up: a short pitch beside the form, stacked on phones. */
export const FormContainer = ({ title, intro, children }: PropsWithChildren<Props>): JSX.Element => (
  <Box
    component="main"
    sx={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
      gridTemplateRows: { xs: 'auto 1fr', md: '1fr' },
    }}
  >
    <Box
      sx={{
        bgcolor: '#1f1d18',
        color: '#f6f2ea',
        px: { xs: 3, sm: 6 },
        py: { xs: 4, md: 8 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: { md: 'space-between' },
        gap: 2,
      }}
    >
      <Typography component="p" sx={{ fontFamily: 'h1.fontFamily', fontSize: '1.375rem', fontWeight: 600 }}>
        Jobs Board
      </Typography>
      <Box sx={{ maxWidth: 420 }}>
        <Typography component="p" sx={{ fontFamily: 'h1.fontFamily', fontSize: { xs: '1.5rem', md: '2rem' } }}>
          Open roles, one click to apply.
        </Typography>
        <Typography component="p" sx={{ mt: 1.5, opacity: 0.8, display: { xs: 'none', sm: 'block' } }}>
          Every listing shows how many people have applied, never who. Apply once and the role stays marked for you.
        </Typography>
      </Box>
    </Box>

    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'center',
        px: 2,
        py: { xs: 3, md: 8 },
      }}
    >
      <Paper variant="outlined" sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 4 } }}>
        <Typography component="h1" variant="h5" sx={{ fontSize: '1.75rem' }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {intro}
        </Typography>
        {children}
      </Paper>
    </Box>
  </Box>
);
