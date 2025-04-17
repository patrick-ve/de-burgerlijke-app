import {
  sqliteTable,
  text,
  real,
  integer,
  primaryKey,
} from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';

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
