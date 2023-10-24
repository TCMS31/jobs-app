import { FormContainer } from 'components/FormContainer/FormContainer';
import { SignupForm } from 'components/Forms/SignupForm/SignupForm';

export const Signup = (): JSX.Element => (
  <FormContainer title="Sign up" intro="An account is all you need to apply.">
    <SignupForm />
  </FormContainer>
);
