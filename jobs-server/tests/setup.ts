// Loaded by mocha before every test file, and before anything reads the environment.
import 'dotenv/config';

process.env.NODE_ENV = 'test';

// The suite writes real rows. Point it at TEST_DATABASE_URL when one is configured so it
// cannot leave fixtures behind in the database being used for development. dotenv is
// loaded here first so a TEST_DATABASE_URL set in .env is visible, and it never
// overwrites a variable that is already set, so this assignment wins.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
