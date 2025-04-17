import { sql } from 'drizzle-orm';
import { db } from '../server/utils/db';

async function generateVectorIndexing() {
  try {
    console.log('Attempting to create vector index...');
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS vector_index ON products (libsql_vector_idx(name_embedding))`
    );
    console.log(
      'Successfully created or ensured vector index exists.'
    );
  } catch (error) {
    console.error('Failed to create vector index:', error);
  }
}

generateVectorIndexing();
