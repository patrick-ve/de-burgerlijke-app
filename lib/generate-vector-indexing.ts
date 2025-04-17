import { sql } from 'drizzle-orm';
import { db } from '../server/utils/db';

async function generateVectorIndexing() {
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS vector_index ON products(name_embedding) USING vector_cosine(1536)`
  );
}

generateVectorIndexing();
