import { app } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

const server = app.listen(env.port, () => console.log(`🚀 Server started at: http://localhost:${env.port}`));

const shutdown = (signal: string): void => {
  console.log(`\n${signal} received, shutting down.`);
  server.close(() => {
    void prisma.$disconnect().then(() => process.exit(0));
  });
};

['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, () => shutdown(signal)));
