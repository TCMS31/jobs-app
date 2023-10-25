import axios from 'axios';

/** Pulls the API's `message` out of a failed request, falling back to a safe default. */
export const messageFrom = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;

    if (message) {
      return message;
    }

    if (!error.response) {
      return 'Could not reach the server. Is the API running?';
    }
  }

  return fallback;
};
