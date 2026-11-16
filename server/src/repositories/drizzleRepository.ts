import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import {
  referralLedger,
  tenants,
  tenantVisits,
  transactions,
  users,
  winbackVouchers,
} from '../db/schema';
import {
  CreateUserInput,
  ReferralRepository,
  RepositoryContainer,
  TenantRepository,
  TransactionRepository,
  UserRecord,
  UserRepository,
  VisitRepository,
  VoucherRepository,
} from './ports';
import {
  CustomerShopStatusDTO,
  ReferralLedgerDTO,
  TenantDTO,
  TransactionDTO,
  UserDTO,
  VoucherDTO,
} from '@growlocal/shared';

function mapTenant(row: typeof tenants.$inferSelect): TenantDTO {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    description: row.description,
    town: row.town,
    rewardOffer: row.rewardOffer,
    minBillCents: row.minBillCents,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapUser(row: typeof users.$inferSelect): UserRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    passwordHash: row.passwordHash,
    role: row.role,
    referralCode: row.referralCode,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapTransaction(row: typeof transactions.$inferSelect): TransactionDTO {
  return {
    id: row.id,
    tenantId: row.tenantId,
    clientId: row.clientId,
    billAmountCents: row.billAmountCents,
    discountCents: row.discountCents,
    finalAmountCents: row.finalAmountCents,
    referralCodeUsed: row.referralCodeUsed,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapReferral(row: typeof referralLedger.$inferSelect): ReferralLedgerDTO {
  return {
    id: row.id,
    tenantId: row.tenantId,
    referrerId: row.referrerId,
    refereeId: row.refereeId,
    status: row.status,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapVoucher(row: typeof winbackVouchers.$inferSelect): VoucherDTO {
  return {
    id: row.id,
    tenantId: row.tenantId,
    clientId: row.clientId,
    code: row.code,
    offerText: row.offerText,
    expiresAt: row.expiresAt.toISOString(),
    redeemedAt: row.redeemedAt ? row.redeemedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export class DrizzleTenantRepository implements TenantRepository {
  async listAll(): Promise<TenantDTO[]> {
    const rows = await db.select().from(tenants).orderBy(desc(tenants.createdAt));
    return rows.map(mapTenant);
  }

  async findById(id: string): Promise<TenantDTO | null> {
    const [row] = await db.select().from(tenants).where(eq(tenants.id, id));
    return row ? mapTenant(row) : null;
  }

  async findBySlug(slug: string): Promise<TenantDTO | null> {
    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug.toLowerCase()));
    return row ? mapTenant(row) : null;
  }

  async create(input: {
    name: string;
    slug: string;
    category?: string;
    description?: string;
    town?: string;
    rewardOffer?: string;
    minBillCents?: number;
  }): Promise<TenantDTO> {
    const [row] = await db
      .insert(tenants)
      .values({
        name: input.name,
        slug: input.slug.toLowerCase(),
        category: input.category ?? 'General',
        description: input.description ?? '',
        town: input.town ?? 'Boac',
        rewardOffer: input.rewardOffer ?? 'Referral rewards coming soon',
        minBillCents: input.minBillCents ?? 0,
      })
      .returning();
    return mapTenant(row);
  }
}

export class DrizzleUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));
    return row ? mapUser(row) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const [row] = await db.select().from(users).where(eq(users.id, id));
    return row ? mapUser(row) : null;
  }

  async findByReferralCode(code: string): Promise<UserRecord | null> {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, code.toUpperCase()));
    return row ? mapUser(row) : null;
  }

  async findByPhone(phone: string): Promise<UserRecord | null> {
    const [row] = await db.select().from(users).where(eq(users.phone, phone));
    return row ? mapUser(row) : null;
  }

  async listClients(tenantId?: string): Promise<UserDTO[]> {
    if (!tenantId) {
      const rows = await db.select().from(users).where(eq(users.role, 'CLIENT'));
      return rows.map(({ passwordHash: _, ...dto }) => dto as unknown as UserDTO);
    }
    const rows = await db
      .select({ user: users })
      .from(users)
      .innerJoin(tenantVisits, eq(users.id, tenantVisits.clientId))
      .where(and(eq(users.role, 'CLIENT'), eq(tenantVisits.tenantId, tenantId)));
    return rows.map((r) => {
      const { passwordHash: _, ...dto } = mapUser(r.user);
      return dto;
    });
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    const [row] = await db
      .insert(users)
      .values({
        tenantId: input.tenantId ?? null,
        fullName: input.fullName,
        email: input.email.toLowerCase(),
        phone: input.phone ?? null,
        passwordHash: input.passwordHash,
        role: input.role,
        referralCode: input.referralCode.toUpperCase(),
      })
      .returning();
    return mapUser(row);
  }

}

export class DrizzleVisitRepository implements VisitRepository {
  async hasVisited(tenantId: string, clientId: string): Promise<boolean> {
    const [row] = await db
      .select()
      .from(tenantVisits)
      .where(
        and(eq(tenantVisits.tenantId, tenantId), eq(tenantVisits.clientId, clientId))
      );
    return !!row;
  }

  async recordVisit(tenantId: string, clientId: string): Promise<{ visitCount: number }> {
    const [existing] = await db
      .select()
      .from(tenantVisits)
      .where(
        and(eq(tenantVisits.tenantId, tenantId), eq(tenantVisits.clientId, clientId))
      );

    if (existing) {
      const [updated] = await db
        .update(tenantVisits)
        .set({
          visitCount: existing.visitCount + 1,
          lastVisitedAt: new Date(),
        })
        .where(eq(tenantVisits.id, existing.id))
        .returning();
      return { visitCount: updated.visitCount };
    }

    const [created] = await db
      .insert(tenantVisits)
      .values({
        tenantId,
        clientId,
        visitCount: 1,
      })
      .returning();
    return { visitCount: created.visitCount };
  }

  async listCustomerShops(clientId: string): Promise<CustomerShopStatusDTO[]> {
    const allTenants = await db.select().from(tenants);
    const visits = await db
      .select()
      .from(tenantVisits)
      .where(eq(tenantVisits.clientId, clientId));

    return allTenants.map((t) => {
      const visit = visits.find((v) => v.tenantId === t.id);
      return {
        tenantId: t.id,
        tenantName: t.name,
        town: t.town,
        category: t.category,
        rewardOffer: t.rewardOffer,
        isVerifiedVisitor: !!visit,
        visitCount: visit?.visitCount ?? 0,
        lastVisitedAt: visit?.lastVisitedAt?.toISOString() ?? null,
      };
    });
  }
}

export class DrizzleTransactionRepository implements TransactionRepository {
  async create(input: {
    tenantId: string;
    clientId: string;
    billAmountCents: number;
    discountCents: number;
    finalAmountCents: number;
    referralCodeUsed?: string;
  }): Promise<TransactionDTO> {
    const [row] = await db
      .insert(transactions)
      .values({
        tenantId: input.tenantId,
        clientId: input.clientId,
        billAmountCents: input.billAmountCents,
        discountCents: input.discountCents,
        finalAmountCents: input.finalAmountCents,
        referralCodeUsed: input.referralCodeUsed,
      })
      .returning();
    return mapTransaction(row);
  }

  async listByTenant(tenantId: string): Promise<TransactionDTO[]> {
    const rows = await db
      .select({
        transaction: transactions,
        clientName: users.fullName,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.clientId, users.id))
      .where(eq(transactions.tenantId, tenantId))
      .orderBy(desc(transactions.createdAt));

    return rows.map((r) => ({
      ...mapTransaction(r.transaction),
      clientName: r.clientName ?? undefined,
    }));
  }

  async listByClient(clientId: string): Promise<TransactionDTO[]> {
    const rows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.clientId, clientId))
      .orderBy(desc(transactions.createdAt));
    return rows.map(mapTransaction);
  }
}

export class DrizzleReferralRepository implements ReferralRepository {
  async listAll(tenantId?: string): Promise<ReferralLedgerDTO[]> {
    const condition = tenantId ? eq(referralLedger.tenantId, tenantId) : undefined;
    const rows = await db
      .select({
        referral: referralLedger,
        tenantName: tenants.name,
        referrerName: users.fullName,
      })
      .from(referralLedger)
      .leftJoin(tenants, eq(referralLedger.tenantId, tenants.id))
      .leftJoin(users, eq(referralLedger.referrerId, users.id))
      .where(condition)
      .orderBy(desc(referralLedger.createdAt));

    return rows.map((r) => ({
      ...mapReferral(r.referral),
      tenantName: r.tenantName ?? undefined,
      referrerName: r.referrerName ?? undefined,
    }));
  }

  async listByReferrer(referrerId: string, tenantId?: string): Promise<ReferralLedgerDTO[]> {
    const condition = tenantId
      ? and(
          eq(referralLedger.referrerId, referrerId),
          eq(referralLedger.tenantId, tenantId)
        )
      : eq(referralLedger.referrerId, referrerId);

    const rows = await db
      .select({
        referral: referralLedger,
        tenantName: tenants.name,
      })
      .from(referralLedger)
      .leftJoin(tenants, eq(referralLedger.tenantId, tenants.id))
      .where(condition)
      .orderBy(desc(referralLedger.createdAt));

    return rows.map((r) => ({
      ...mapReferral(r.referral),
      tenantName: r.tenantName ?? undefined,
    }));
  }

  async findByRefereeAndTenant(
    refereeId: string,
    tenantId: string
  ): Promise<ReferralLedgerDTO | null> {
    const [row] = await db
      .select()
      .from(referralLedger)
      .where(
        and(
          eq(referralLedger.refereeId, refereeId),
          eq(referralLedger.tenantId, tenantId)
        )
      );
    return row ? mapReferral(row) : null;
  }

  async createPending(input: {
    tenantId: string;
    referrerId: string;
    refereeId: string;
  }): Promise<ReferralLedgerDTO> {
    const [row] = await db
      .insert(referralLedger)
      .values({
        tenantId: input.tenantId,
        referrerId: input.referrerId,
        refereeId: input.refereeId,
        status: 'PENDING_COMPLETION',
      })
      .returning();
    return mapReferral(row);
  }

  async markCompleted(
    id: string,
    transactionId: string,
    completedAt: Date
  ): Promise<ReferralLedgerDTO> {
    const [row] = await db
      .update(referralLedger)
      .set({
        status: 'COMPLETED',
        transactionId,
        completedAt,
      })
      .where(eq(referralLedger.id, id))
      .returning();
    return mapReferral(row);
  }
}

export class DrizzleVoucherRepository implements VoucherRepository {
  async findByCode(code: string, tenantId?: string): Promise<VoucherDTO | null> {
    const condition = tenantId
      ? and(
          eq(winbackVouchers.code, code.toUpperCase()),
          eq(winbackVouchers.tenantId, tenantId)
        )
      : eq(winbackVouchers.code, code.toUpperCase());
    const [row] = await db.select().from(winbackVouchers).where(condition);
    return row ? mapVoucher(row) : null;
  }

  async listByClient(clientId: string, tenantId?: string): Promise<VoucherDTO[]> {
    const condition = tenantId
      ? and(
          eq(winbackVouchers.clientId, clientId),
          eq(winbackVouchers.tenantId, tenantId)
        )
      : eq(winbackVouchers.clientId, clientId);

    const rows = await db.select().from(winbackVouchers).where(condition);
    return rows.map(mapVoucher);
  }

  async listByTenant(tenantId: string): Promise<VoucherDTO[]> {
    const rows = await db
      .select({
        voucher: winbackVouchers,
        clientName: users.fullName,
        clientEmail: users.email,
      })
      .from(winbackVouchers)
      .leftJoin(users, eq(winbackVouchers.clientId, users.id))
      .where(eq(winbackVouchers.tenantId, tenantId))
      .orderBy(desc(winbackVouchers.createdAt));

    return rows.map((r) => ({
      ...mapVoucher(r.voucher),
      clientName: r.clientName ?? undefined,
      clientEmail: r.clientEmail ?? undefined,
    }));
  }

  async create(input: {
    tenantId: string;
    clientId: string;
    code: string;
    offerText: string;
    expiresAt: Date;
  }): Promise<VoucherDTO> {
    const [row] = await db
      .insert(winbackVouchers)
      .values({
        tenantId: input.tenantId,
        clientId: input.clientId,
        code: input.code.toUpperCase(),
        offerText: input.offerText,
        expiresAt: input.expiresAt,
      })
      .returning();
    return mapVoucher(row);
  }

  async markRedeemed(id: string): Promise<VoucherDTO> {
    const [row] = await db
      .update(winbackVouchers)
      .set({ redeemedAt: new Date() })
      .where(eq(winbackVouchers.id, id))
      .returning();
    return mapVoucher(row);
  }
}

export function createDrizzleRepositories(): RepositoryContainer {
  return {
    tenants: new DrizzleTenantRepository(),
    users: new DrizzleUserRepository(),
    visits: new DrizzleVisitRepository(),
    transactions: new DrizzleTransactionRepository(),
    referrals: new DrizzleReferralRepository(),
    vouchers: new DrizzleVoucherRepository(),
  };
}
