import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Container, Grid, Typography } from '@mui/material';
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
  const load = useCallback(async (cursor: string | null) => {
    try {
      const { data } = await getJobs({ cursor });

      setJobs((current) => (cursor ? [...current, ...data.payload.jobs] : data.payload.jobs));
      setNextCursor(data.payload.nextCursor);
      setStatus('ready');
    } catch (loadError) {
      // Previously this threw inside an async effect, which React could not catch: the
      // page stayed blank with an unhandled rejection in the console and no message.
      setError(messageFrom(loadError, 'Could not load job listings.'));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load(null);
  }, [load]);

  const handleApplied = useCallback((jobId: string) => {
    setJobs((current) =>
      current.map((job) =>
        job.id === jobId ? { ...job, hasApplied: true, applicantCount: job.applicantCount + 1 } : job
      )
    );
  }, []);
  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    await load(nextCursor);
    setIsLoadingMore(false);
  }, [load, nextCursor]);

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Box sx={{ mb: 4 }}>
          <Typography component="h1" variant="h1" gutterBottom>
            Open roles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse the latest listings and apply in one click.
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
              <Button color="inherit" size="small" onClick={() => void load(null)}>
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
            <Grid container spacing={3}>
              {jobs.map((job) => (
                <Job key={job.id} job={job} onApplied={handleApplied} />
              ))}
            </Grid>

            {nextCursor && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
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
