import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' }); // Explicitly load .env

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dbCredentials: {
    url: './server/db/local.sqlite',
  },
});
