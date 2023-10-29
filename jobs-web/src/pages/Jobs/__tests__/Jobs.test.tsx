import { Router } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { AuthProvider } from 'contexts/AuthContext';
import { createMemoryHistory } from 'history';

import { routes } from 'constants/routes';
import { mockedJobPage, mockedJobs } from 'fixtures/jobs';
import { authStorage } from 'services/authStorage';

import { Jobs } from '../Jobs';

const renderComponent = (): void => {
  const history = createMemoryHistory();

  render(
    <Router location={routes.jobs} navigator={history}>
      <AuthProvider>
        <Jobs />
      </AuthProvider>
    </Router>
  );
};
const resolveJobs = (page = mockedJobPage): void => {
  (axios.get as jest.Mock).mockImplementation((requestUrl: string) =>
    requestUrl.includes('/jobs') ? Promise.resolve({ data: { payload: page } }) : Promise.reject()
  );
};

describe('<Jobs />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStorage.write({ authtoken: 'token', userId: 'user-1', name: 'Ada Okafor' });
  });

  afterEach(() => authStorage.clear());

  it('renders every listing returned by the API', async () => {
    resolveJobs();
    renderComponent();

    expect(await screen.findByText(mockedJobs[0].title)).toBeInTheDocument();

    mockedJobs.forEach((job) => {
      expect(screen.getByText(job.title)).toBeInTheDocument();
      expect(screen.getByText(job.description)).toBeInTheDocument();
      // getAllByText: two of the fixtures share an employment type.
      expect(screen.getAllByText(job.employmentType).length).toBeGreaterThan(0);
      expect(screen.getAllByText(job.experienceLevel).length).toBeGreaterThan(0);
    });
  });

  it('shows a loading indicator before the listings arrive', async () => {
    resolveJobs();
    renderComponent();

    expect(screen.getByLabelText('Loading job listings')).toBeInTheDocument();

    // Let the request settle inside the test, otherwise the state update lands after the
    // test has finished and React reports an update outside act().
    await screen.findByText(mockedJobs[0].title);
    expect(screen.queryByLabelText('Loading job listings')).not.toBeInTheDocument();
  });

  it('shows the applicant count, singular and plural', async () => {
    resolveJobs();
    renderComponent();

    expect(await screen.findByText('4 applicants')).toBeInTheDocument();
    expect(screen.getByText('0 applicants')).toBeInTheDocument();
  });

  it('marks a job the user already applied to as Applied and disables it', async () => {
    resolveJobs();
    renderComponent();

    await screen.findByText(mockedJobs[1].title);

    const applied = screen.getByRole('button', { name: 'Applied' });

    expect(applied).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Apply to job' })).toHaveLength(2);
  });

  it('applies to a job and flips that card to Applied', async () => {
    resolveJobs();
    (axios.post as jest.Mock).mockResolvedValue({ data: { payload: { jobId: mockedJobs[0].id } } });
    renderComponent();

    await screen.findByText(mockedJobs[0].title);

    userEvent.click(screen.getAllByRole('button', { name: 'Apply to job' })[0]);

    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Applied' })).toHaveLength(2));

    expect(axios.post).toHaveBeenCalledWith('/jobs/apply', { jobId: mockedJobs[0].id });
    expect(await screen.findByText('5 applicants')).toBeInTheDocument();
  });

  it('surfaces a failed application without losing the page', async () => {
    resolveJobs();
    (axios.post as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: { status: 500, data: { message: 'Something went wrong' } },
    });
    renderComponent();

    await screen.findByText(mockedJobs[0].title);

    userEvent.click(screen.getAllByRole('button', { name: 'Apply to job' })[0]);

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByText(mockedJobs[0].title)).toBeInTheDocument();
  });

  it('shows an error with a retry when the listings cannot be loaded', async () => {
    (axios.get as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: { status: 500, data: { message: 'Could not load job listings.' } },
    });
    renderComponent();

    expect(await screen.findByText('Could not load job listings.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows an empty state rather than a blank page when there are no listings', async () => {
    resolveJobs({ jobs: [], nextCursor: null });
    renderComponent();

    expect(await screen.findByText('There are no open roles right now. Check back soon.')).toBeInTheDocument();
  });

  it('loads the next page when there is a cursor', async () => {
    const nextJob = { ...mockedJobs[0], id: 'page-two-job', title: 'Security Engineer' };

    (axios.get as jest.Mock)
      .mockResolvedValueOnce({ data: { payload: { jobs: mockedJobs, nextCursor: 'cursor-1' } } })
      .mockResolvedValueOnce({ data: { payload: { jobs: [nextJob], nextCursor: null } } });

    renderComponent();

    const loadMore = await screen.findByRole('button', { name: 'Load more roles' });

    userEvent.click(loadMore);

    expect(await screen.findByText('Security Engineer')).toBeInTheDocument();
    expect(axios.get).toHaveBeenLastCalledWith('/jobs', { params: { cursor: 'cursor-1' } });
  });

  it('signs the user out from the header', async () => {
    resolveJobs();
    renderComponent();

    await screen.findByText(mockedJobs[0].title);
    expect(screen.getByText('Signed in as Ada Okafor')).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(authStorage.read()).toBeNull());
    await waitFor(() => expect(screen.queryByText('Signed in as Ada Okafor')).not.toBeInTheDocument());
  });
});
