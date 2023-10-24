import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Container, Typography } from '@mui/material';
import { JobType } from 'types/job';

import { Header } from 'components/Header/Header';
import { Job } from 'components/Job/Job';
import { messageFrom } from 'services/errorMessage';
import { getJobs } from 'services/jobService';

type Status = 'loading' | 'ready' | 'error';

export const Jobs = (): JSX.Element => {
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const loadFirstPage = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const { data } = await getJobs();

      setJobs(data.payload.jobs);
      setNextCursor(data.payload.nextCursor);
      setStatus('ready');
    } catch (loadError) {
      setError(messageFrom(loadError, 'Could not load job listings.'));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const handleApplied = useCallback((jobId: string) => {
    setJobs((current) =>
      current.map((job) =>
        job.id === jobId ? { ...job, hasApplied: true, applicantCount: job.applicantCount + 1 } : job
      )
    );
  }, []);
  // A failed next page keeps the roles already on screen; only the button area reports it.
  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const { data } = await getJobs({ cursor: nextCursor });

      setJobs((current) => [...current, ...data.payload.jobs]);
      setNextCursor(data.payload.nextCursor);
    } catch (loadError) {
      setLoadMoreError(messageFrom(loadError, 'Could not load more roles.'));
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor]);

  return (
    <>
      <Header />
      <Container component="main" maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
        <Box component="section" aria-labelledby="open-roles-heading" sx={{ mb: 3 }}>
          <Typography variant="overline" color="secondary">
            Now hiring
          </Typography>
          <Typography id="open-roles-heading" component="h1" variant="h1" gutterBottom>
            Open roles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Newest first. Apply in one click; a role you have applied to stays marked.
          </Typography>
        </Box>

        {status === 'loading' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress aria-label="Loading job listings" />
          </Box>
        )}

        {status === 'error' && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void loadFirstPage()}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {status === 'ready' && jobs.length === 0 && (
          <Alert severity="info">There are no open roles right now. Check back soon.</Alert>
        )}

        {status === 'ready' && jobs.length > 0 && (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              {jobs.map((job) => (
                <Job key={job.id} job={job} onApplied={handleApplied} />
              ))}
            </Box>

            {nextCursor && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 4 }}>
                {loadMoreError && <Alert severity="error">{loadMoreError}</Alert>}
                <Button variant="outlined" onClick={handleLoadMore} disabled={isLoadingMore}>
                  {isLoadingMore ? 'Loading…' : 'Load more roles'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Container>
    </>
  );
};
