import { useCallback, useState } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
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
  const headingId = `job-${job.id}-title`;
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
    <Box
      component="article"
      aria-labelledby={headingId}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
        columnGap: 4,
        rowGap: 2,
        py: 3,
        borderTop: 1,
        borderColor: 'divider',
        borderLeft: 4,
        borderLeftColor: job.hasApplied ? 'primary.main' : 'transparent',
        pl: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography id={headingId} component="h2" variant="h2">
          {job.title}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          <Chip size="small" label={job.experienceLevel} sx={{ bgcolor: '#e6efe9', color: 'primary.dark' }} />
          <Chip size="small" variant="outlined" label={job.employmentType} />
          <Typography component="span" variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Posted <time dateTime={job.createdAt}>{formatDate(job.createdAt)}</time>
          </Typography>
        </Stack>
        <Typography variant="body1" sx={{ mt: 1.5, maxWidth: '62ch' }}>
          {job.description}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'row', sm: 'column' },
          alignItems: { xs: 'center', sm: 'flex-end' },
          justifyContent: { xs: 'space-between', sm: 'flex-start' },
          gap: 1.5,
          minWidth: { sm: 150 },
        }}
      >
        {job.hasApplied ? (
          <Button
            disabled
            startIcon={<CheckIcon />}
            variant="outlined"
            // MUI's disabled grey fails contrast; this state is information, not an inactive control.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            sx={{ '&.Mui-disabled': { color: 'primary.dark', borderColor: 'primary.main' } }}
          >
            Applied
          </Button>
        ) : (
          <Button onClick={handleApply} disabled={isApplying} variant="contained">
            {isApplying ? 'Applying…' : 'Apply to job'}
          </Button>
        )}
        <Typography variant="body2" color="text.secondary" className="applicant-count">
          {job.applicantCount === 1 ? '1 applicant' : `${job.applicantCount} applicants`}
        </Typography>
      </Box>

      {error && (
        <Typography variant="body2" color="error" role="alert" sx={{ gridColumn: '1 / -1' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};
