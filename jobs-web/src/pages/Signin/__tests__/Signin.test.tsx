import { Router } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { AuthProvider } from 'contexts/AuthContext';
import { createMemoryHistory } from 'history';

import { routes } from 'constants/routes';
import { authStorage } from 'services/authStorage';

import { Signin } from '../Signin';

let history = createMemoryHistory();
const renderComponent = (): void => {
  history = createMemoryHistory({ initialEntries: [routes.signin] });

  render(
    <Router location={routes.signin} navigator={history}>
      <AuthProvider>
        <Signin />
      </AuthProvider>
    </Router>
  );
};
const fillCredentials = (): void => {
  userEvent.type(screen.getByLabelText('Email Address'), 'ada@example.com');
  userEvent.type(screen.getByLabelText('Password'), 'abcd1234');
};

describe('<Signin />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStorage.clear();
  });

  afterEach(() => authStorage.clear());

  it('renders the sign-in form', () => {
    renderComponent();

    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Don't have an account? Sign Up" })).toHaveAttribute('href', routes.signup);
  });

  it('validates required and malformed fields', async () => {
    renderComponent();

    userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();

    userEvent.type(screen.getByLabelText('Email Address'), 'email');

    expect(await screen.findByText('Please enter a valid email')).toBeInTheDocument();
  });

  it('stores the session and navigates on a successful sign-in', async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: { payload: { authtoken: 'a-real-token', userId: 'user-1', name: 'Ada Okafor' } },
    });

    renderComponent();
    fillCredentials();
    userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => expect(history.location.pathname).toBe(routes.jobs));

    expect(authStorage.read()).toEqual({
      authtoken: 'a-real-token',
      userId: 'user-1',
      name: 'Ada Okafor',
    });
  });

  it('does NOT navigate when the credentials are rejected', async () => {
    (axios.post as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { message: 'Invalid email/password' } },
    });

    renderComponent();
    fillCredentials();
    userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email/password');
    expect(history.location.pathname).toBe(routes.signin);
    expect(authStorage.read()).toBeNull();
  });

  it('does NOT navigate when the response carries no token', async () => {
    // A regression test for a fixture whose field was spelled `authtoke`: the form used to
    // store undefined and navigate to the jobs page anyway, so a broken login looked fine.
    (axios.post as jest.Mock).mockResolvedValue({ data: { payload: { userId: 'user-1' } } });

    renderComponent();
    fillCredentials();
    userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Sign in failed, please try again.');
    expect(history.location.pathname).toBe(routes.signin);
    expect(authStorage.read()).toBeNull();
  });

  it('explains an unreachable API rather than failing silently', async () => {
    (axios.post as jest.Mock).mockRejectedValue({ isAxiosError: true, request: {} });

    renderComponent();
    fillCredentials();
    userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server.');
    expect(history.location.pathname).toBe(routes.signin);
  });
});
