import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Link } from '@mui/material';
import { Form, Formik, FormikHelpers } from 'formik';
import { signupSchema } from 'schemas/signupSchema';
import { SignupPayload } from 'types/signupPayload';

import { TextInput } from 'components/TextInput/TextInput';
import { routes } from 'constants/routes';
import { signup } from 'services/authService';
import { messageFrom } from 'services/errorMessage';

export const SignupForm = (): JSX.Element => {
  const navigate = useNavigate();
  const handleSubmit = useCallback(
    async (values: SignupPayload, { setStatus }: FormikHelpers<SignupPayload>) => {
      setStatus(undefined);

      try {
        await signup(values);
        navigate(routes.signin);
      } catch (error) {
        setStatus(messageFrom(error, 'Sign up failed, please try again.'));
      }
    },
    [navigate]
  );

  return (
    <>
      <Formik
        initialValues={{ name: '', email: '', password: '' }}
        onSubmit={handleSubmit}
        validationSchema={signupSchema}
      >
        {({ status, isSubmitting }) => (
          <Form noValidate>
            {status && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {status}
              </Alert>
            )}
            <TextInput fullWidth name="name" label="Full Name" autoComplete="name" />
            <TextInput fullWidth name="email" label="Email Address" type="email" autoComplete="email" />
            <TextInput
              fullWidth
              name="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              helperText="At least 8 characters."
            />
            <Button type="submit" fullWidth variant="contained" disabled={isSubmitting} sx={{ mt: 3, mb: 2 }}>
              {isSubmitting ? 'Creating account…' : 'Sign Up'}
            </Button>
          </Form>
        )}
      </Formik>
      <Link href={routes.signin} variant="body2" underline="hover">
        Already have an account? Sign In
      </Link>
    </>
  );
};
