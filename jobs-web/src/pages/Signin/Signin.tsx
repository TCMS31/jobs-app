import { FormContainer } from 'components/FormContainer/FormContainer';
import { SigninForm } from 'components/Forms/SigninForm/SigninForm';

export const Signin = (): JSX.Element => (
  <FormContainer title="Sign in" intro="Pick up where you left off.">
    <SigninForm />
  </FormContainer>
);
