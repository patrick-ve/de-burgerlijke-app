import { sql, relations, SQL } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  real,
  integer,
  primaryKey,
  customType,
} from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

// Custom Type for Vector Embeddings (Float32)
const float32Array = customType<{
  data: number[];
  config: { dimensions: number };
  configRequired: true;
  driverData: Buffer;
}>({
  dataType(config) {
    // IMPORTANT: Turso expects F32_BLOB(<dimensions>)
    return `F32_BLOB(${config.dimensions})`;
  },
  fromDriver(value: Buffer): number[] {
    // Convert the Buffer from the database back into an array of numbers
    return Array.from(new Float32Array(value.buffer));
  },
  toDriver(value: number[]): SQL {
    // Convert the array of numbers into the SQL function call for insertion
    // Drizzle expects an SQL object here
    return sql`vector32(${JSON.stringify(value)})`;
  },
});

// Supermarkets Table
export const supermarkets = sqliteTable('supermarkets', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    new Date()
  ),
});

// Products Table
export const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').notNull(),
  link: text('link').notNull().unique(),
  price: real('price').notNull(), // Changed from decimal to real
  amount: text('amount'),
  supermarketId: text('supermarket_id')
    .notNull()
    .references(() => supermarkets.id),
  nameEmbedding: float32Array('name_embedding', {
    dimensions: 1536,
  }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    new Date()
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    new Date()
  ),
});

// Define Relations (Optional but good practice)
export const supermarketRelations = relations(
  supermarkets,
  ({ many }) => ({
    products: many(products),
  })
);

export const productRelations = relations(products, ({ one }) => ({
  supermarket: one(supermarkets, {
    fields: [products.supermarketId],
    references: [supermarkets.id],
  }),
}));
