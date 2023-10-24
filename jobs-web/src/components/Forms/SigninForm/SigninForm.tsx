import { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Link } from '@mui/material';
import { AuthContext } from 'contexts/AuthContext';
import { Form, Formik, FormikHelpers } from 'formik';
import { signinSchema } from 'schemas/signinSchema';
import { SigninPayload } from 'types/signin';

import { TextInput } from 'components/TextInput/TextInput';
import { routes } from 'constants/routes';
import { login } from 'services/authService';
import { messageFrom } from 'services/errorMessage';

export const SigninForm = (): JSX.Element => {
  const { signIn } = useContext(AuthContext);
  const navigate = useNavigate();
  const handleSubmit = useCallback(
    async (values: SigninPayload, { setStatus }: FormikHelpers<SigninPayload>) => {
      setStatus(undefined);

      try {
        const { data } = await login(values);
        const { authtoken, userId, name } = data.payload;

        // Navigating only after a session has actually been established. The previous
        // version destructured the response, stored whatever it found and navigated
        // regardless, so a failed or malformed login still landed on the jobs page.
        if (!authtoken || !userId) {
          setStatus('Sign in failed, please try again.');

          return;
        }

        signIn({ authtoken, userId, name: name ?? '' });
        navigate(routes.jobs);
      } catch (error) {
        setStatus(messageFrom(error, 'Sign in failed, please try again.'));
      }
    },
    [navigate, signIn]
  );

  return (
    <>
      <Formik initialValues={{ email: '', password: '' }} onSubmit={handleSubmit} validationSchema={signinSchema}>
        {({ status, isSubmitting }) => (
          <Form noValidate>
            {status && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {status}
              </Alert>
            )}
            <TextInput fullWidth name="email" label="Email Address" type="email" autoComplete="email" />
            <TextInput fullWidth name="password" label="Password" type="password" autoComplete="current-password" />
            <Button type="submit" fullWidth variant="contained" disabled={isSubmitting} sx={{ mt: 3, mb: 2 }}>
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </Form>
        )}
      </Formik>
      <Link href={routes.signup} variant="body2" underline="hover">
        Don&apos;t have an account? Sign Up
      </Link>
    </>
  );
};
