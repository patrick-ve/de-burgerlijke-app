import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../db/schema';

const sqliteClient = createClient({
  url: 'file:./server/db/local.sqlite',
  // authToken: 'YOUR_LIBSQL_AUTH_TOKEN', // Optional: For remote Turso DB
});

export const db = drizzle(sqliteClient, { schema });
