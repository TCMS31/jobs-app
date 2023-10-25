import bcrypt from 'bcrypt';

export const encryptData = (data: string) => bcrypt.hashSync(data, 10);
export const compareData = (data: string, hash: string) => bcrypt.compareSync(data, hash);
