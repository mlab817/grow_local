import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['OWNER', 'CLIENT']);
export const referralStatusEnum = pgEnum('referral_status', [
  'PENDING_COMPLETION',
  'COMPLETED',
  'VOIDED',
]);

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  category: varchar('category', { length: 80 }).default('General').notNull(),
  description: varchar('description', { length: 255 }).default('').notNull(),
  town: varchar('town', { length: 80 }).default('Boac').notNull(),
  rewardOffer: varchar('reward_offer', { length: 120 })
    .default('Referral rewards coming soon')
    .notNull(),
  minBillCents: integer('min_bill_cents').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
  fullName: varchar('full_name', { length: 120 }).notNull(),
  email: varchar('email', { length: 160 }).notNull().unique(),
  phone: varchar('phone', { length: 40 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: roleEnum('role').default('CLIENT').notNull(),
  referralCode: varchar('referral_code', { length: 32 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tenantVisits = pgTable(
  'tenant_visits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    visitCount: integer('visit_count').default(1).notNull(),
    firstVisitedAt: timestamp('first_visited_at', { withTimezone: true }).defaultNow().notNull(),
    lastVisitedAt: timestamp('last_visited_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('tenant_visits_tenant_client_idx').on(table.tenantId, table.clientId),
  ]
);

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  billAmountCents: integer('bill_amount_cents').notNull(),
  discountCents: integer('discount_cents').default(0).notNull(),
  finalAmountCents: integer('final_amount_cents').notNull(),
  referralCodeUsed: varchar('referral_code_used', { length: 32 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const referralLedger = pgTable('referral_ledger', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  referrerId: uuid('referrer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  refereeId: uuid('referee_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  transactionId: uuid('transaction_id').references(() => transactions.id, {
    onDelete: 'set null',
  }),
  status: referralStatusEnum('status').default('PENDING_COMPLETION').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const winbackVouchers = pgTable('winback_vouchers', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 32 }).notNull().unique(),
  offerText: varchar('offer_text', { length: 500 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
