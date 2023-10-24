import { Router } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { AuthProvider } from 'contexts/AuthContext';
import { createMemoryHistory } from 'history';

import { routes } from 'constants/routes';

import { Signup } from '../Signup';

let history = createMemoryHistory();
const renderComponent = (): void => {
  history = createMemoryHistory({ initialEntries: [routes.signup] });

  render(
    <Router location={routes.signup} navigator={history}>
      <AuthProvider>
        <Signup />
      </AuthProvider>
    </Router>
  );
};
const fillForm = (): void => {
  userEvent.type(screen.getByLabelText('Full Name'), 'Ada Okafor');
  userEvent.type(screen.getByLabelText('Email Address'), 'ada@example.com');
  userEvent.type(screen.getByLabelText('Password'), 'abcd1234');
};

describe('<Signup />', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the sign-up form', () => {
    renderComponent();

    expect(screen.getByRole('heading', { level: 1, name: 'Sign up' })).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Already have an account? Sign In' })).toHaveAttribute(
      'href',
      routes.signin
    );
  });

  it('validates required and malformed fields', async () => {
    renderComponent();

    userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();

    userEvent.type(screen.getByLabelText('Email Address'), 'email');

    expect(await screen.findByText('Please enter a valid email')).toBeInTheDocument();
  });

  it('enforces the same minimum password length as the API', async () => {
    renderComponent();

    userEvent.type(screen.getByLabelText('Full Name'), 'Ada Okafor');
    userEvent.type(screen.getByLabelText('Email Address'), 'ada@example.com');
    userEvent.type(screen.getByLabelText('Password'), 'short');
    userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('navigates to sign-in once the account is created', async () => {
    (axios.post as jest.Mock).mockResolvedValue({ data: { payload: {} } });

    renderComponent();
    fillForm();
    userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => expect(history.location.pathname).toBe(routes.signin));
  });

  it('does NOT navigate when the email is already taken', async () => {
    (axios.post as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { message: 'User already exists' } },
    });

    renderComponent();
    fillForm();
    userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('User already exists');
    expect(history.location.pathname).toBe(routes.signup);
  });
});
