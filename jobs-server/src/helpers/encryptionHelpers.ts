import bcrypt from 'bcrypt';

const COST = 10;

// Async on purpose: the sync variants block the event loop for ~60 ms per call, so every
// sign-in stalled every other request the process was serving.
export const encryptData = (data: string): Promise<string> => bcrypt.hash(data, COST);
export const compareData = (data: string, hash: string): Promise<boolean> => bcrypt.compare(data, hash);
