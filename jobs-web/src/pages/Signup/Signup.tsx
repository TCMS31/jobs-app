import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Avatar, Box, Typography } from '@mui/material';

import { FormContainer } from 'components/FormContainer/FormContainer';
import { SignupForm } from 'components/Forms/SignupForm/SignupForm';

export const Signup = (): JSX.Element => (
  <FormContainer>
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
        <LockOutlinedIcon />
      </Avatar>
      <Typography component="h1" variant="h5">
        Sign up
      </Typography>
      <SignupForm />
    </Box>
  </FormContainer>
);
