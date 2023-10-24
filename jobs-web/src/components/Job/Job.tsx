import { useCallback, useState } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import { JobType } from 'types/job';

import { messageFrom } from 'services/errorMessage';
import { applyToJob } from 'services/jobService';

interface Props {
  job: JobType;
  onApplied: (jobId: string) => void;
}

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export const Job = ({ job, onApplied }: Props): JSX.Element => {
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // `hasApplied` is computed by the API for the signed-in caller. The client used to work
  // it out by searching a list of every applicant's id that the API sent to everybody.
  const handleApply = useCallback(async () => {
    setIsApplying(true);
    setError(null);

    try {
      await applyToJob(job.id);
      onApplied(job.id);
    } catch (applyError) {
      setError(messageFrom(applyError, 'Could not submit your application.'));
    } finally {
      setIsApplying(false);
    }
  }, [job.id, onApplied]);

  return (
    <Grid item xs={12} md={6}>
      <Card sx={{ height: '100%', display: 'flex' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box>
            <Typography component="h2" variant="h2" gutterBottom>
              {job.title}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip size="small" color="primary" variant="outlined" label={job.experienceLevel} />
              <Chip size="small" variant="outlined" label={job.employmentType} />
              <Chip size="small" variant="outlined" label={`Posted ${formatDate(job.createdAt)}`} />
            </Stack>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
            {job.description}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {job.applicantCount === 1 ? '1 applicant' : `${job.applicantCount} applicants`}
          </Typography>

          {error && (
            <Typography variant="body2" color="error" role="alert">
              {error}
            </Typography>
          )}

          {job.hasApplied ? (
            <Button
              disabled
              startIcon={<CheckCircleIcon />}
              variant="outlined"
              color="secondary"
              sx={{ alignSelf: 'flex-start' }}
            >
              Applied
            </Button>
          ) : (
            <Button onClick={handleApply} disabled={isApplying} variant="contained" sx={{ alignSelf: 'flex-start' }}>
              {isApplying ? 'Applying…' : 'Apply to job'}
            </Button>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
};
