import * as dotenv from 'dotenv';
import path from 'node:path'; // Import path module

// Construct the absolute path to the .env file in the project root
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';

// Load environment variables if they are not already loaded (e.g., by Nuxt)
// Consider Nuxt's runtime config for managing env variables in a Nuxt app
// import { useRuntimeConfig } from '#app'
// const config = useRuntimeConfig()

// Ensure environment variables are loaded. You might manage this differently in Nuxt.
// import dotenv from 'dotenv';
// dotenv.config({ path: '../../.env' }); // Adjust path if necessary

const turso = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_AUTH_TOKEN,
});

export const db = drizzle(turso, { schema });
