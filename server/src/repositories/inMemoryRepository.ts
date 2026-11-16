import crypto from 'crypto';
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

interface VisitRecord {
  tenantId: string;
  clientId: string;
  visitCount: number;
  firstVisitedAt: string;
  lastVisitedAt: string;
}

export function createInMemoryRepositories(seed?: {
  tenants?: TenantDTO[];
  users?: UserRecord[];
  visits?: VisitRecord[];
  transactions?: TransactionDTO[];
  referrals?: ReferralLedgerDTO[];
  vouchers?: VoucherDTO[];
}): RepositoryContainer {
  const defaultTenantId = '00000000-0000-0000-0000-000000000001';
  const tenantStore: TenantDTO[] = [
    ...(seed?.tenants ?? [
      {
        id: defaultTenantId,
        name: 'Downtown Studio & Spa',
        slug: 'downtown-spa',
        category: 'Salon & Wellness',
        description: 'Boutique hair styling and relaxation in Boac.',
        town: 'Boac',
        rewardOffer: 'Referral rewards coming soon',
        minBillCents: 30000,
        createdAt: new Date().toISOString(),
      },
    ]),
  ];
  const userStore: UserRecord[] = [...(seed?.users ?? [])];
  const visitStore: VisitRecord[] = [...(seed?.visits ?? [])];
  const transactionStore: TransactionDTO[] = [...(seed?.transactions ?? [])];
  const referralStore: ReferralLedgerDTO[] = [...(seed?.referrals ?? [])];
  const voucherStore: VoucherDTO[] = [...(seed?.vouchers ?? [])];

  const tenants: TenantRepository = {
    async listAll() {
      return [...tenantStore];
    },
    async findById(id) {
      return tenantStore.find((t) => t.id === id) ?? null;
    },
    async findBySlug(slug) {
      return tenantStore.find((t) => t.slug === slug.toLowerCase()) ?? null;
    },
    async create(input) {
      const record: TenantDTO = {
        id: crypto.randomUUID(),
        name: input.name,
        slug: input.slug.toLowerCase(),
        category: input.category ?? 'General',
        description: input.description ?? '',
        town: input.town ?? 'Boac',
        rewardOffer: input.rewardOffer ?? 'Referral rewards coming soon',
        minBillCents: input.minBillCents ?? 0,
        createdAt: new Date().toISOString(),
      };
      tenantStore.push(record);
      return record;
    },
  };

  const users: UserRepository = {
    async findByEmail(email) {
      return userStore.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
    },
    async findById(id) {
      return userStore.find((u) => u.id === id) ?? null;
    },
    async findByReferralCode(code) {
      return userStore.find((u) => u.referralCode === code.toUpperCase()) ?? null;
    },
    async findByPhone(phone) {
      return userStore.find((u) => u.phone === phone) ?? null;
    },
    async listClients(tenantId) {
      if (!tenantId) {
        return userStore
          .filter((u) => u.role === 'CLIENT')
          .map(({ passwordHash: _, ...dto }) => dto);
      }
      // Return clients who have transacted/visited this tenant
      const visitedClientIds = new Set(
        visitStore.filter((v) => v.tenantId === tenantId).map((v) => v.clientId)
      );
      return userStore
        .filter((u) => u.role === 'CLIENT' && visitedClientIds.has(u.id))
        .map(({ passwordHash: _, ...dto }) => dto);
    },
    async create(input: CreateUserInput) {
      const record: UserRecord = {
        id: crypto.randomUUID(),
        tenantId: input.tenantId ?? null,
        fullName: input.fullName,
        email: input.email.toLowerCase(),
        phone: input.phone ?? null,
        passwordHash: input.passwordHash,
        role: input.role,
        referralCode: input.referralCode.toUpperCase(),
        createdAt: new Date().toISOString(),
      };
      userStore.push(record);
      return record;
    },
  };

  const visits: VisitRepository = {
    async hasVisited(tenantId, clientId) {
      return visitStore.some((v) => v.tenantId === tenantId && v.clientId === clientId);
    },
    async recordVisit(tenantId, clientId) {
      const existing = visitStore.find(
        (v) => v.tenantId === tenantId && v.clientId === clientId
      );
      if (existing) {
        existing.visitCount += 1;
        existing.lastVisitedAt = new Date().toISOString();
        return { visitCount: existing.visitCount };
      }
      visitStore.push({
        tenantId,
        clientId,
        visitCount: 1,
        firstVisitedAt: new Date().toISOString(),
        lastVisitedAt: new Date().toISOString(),
      });
      return { visitCount: 1 };
    },
    async listCustomerShops(clientId) {
      return tenantStore.map((t) => {
        const visit = visitStore.find(
          (v) => v.tenantId === t.id && v.clientId === clientId
        );
        return {
          tenantId: t.id,
          tenantName: t.name,
          town: t.town,
          category: t.category,
          rewardOffer: t.rewardOffer,
          isVerifiedVisitor: !!visit,
          visitCount: visit?.visitCount ?? 0,
          lastVisitedAt: visit?.lastVisitedAt ?? null,
        };
      });
    },
  };

  const transactions: TransactionRepository = {
    async create(input) {
      const record: TransactionDTO = {
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        clientId: input.clientId,
        clientName: userStore.find((u) => u.id === input.clientId)?.fullName,
        billAmountCents: input.billAmountCents,
        discountCents: input.discountCents,
        finalAmountCents: input.finalAmountCents,
        referralCodeUsed: input.referralCodeUsed ?? null,
        createdAt: new Date().toISOString(),
      };
      transactionStore.push(record);
      return record;
    },
    async listByTenant(tenantId) {
      return transactionStore
        .filter((t) => t.tenantId === tenantId)
        .map((t) => ({
          ...t,
          clientName: userStore.find((u) => u.id === t.clientId)?.fullName,
        }));
    },
    async listByClient(clientId) {
      return transactionStore.filter((t) => t.clientId === clientId);
    },
  };

  const referrals: ReferralRepository = {
    async listAll(tenantId) {
      const filtered = tenantId
        ? referralStore.filter((r) => r.tenantId === tenantId)
        : [...referralStore];
      return filtered.map((r) => ({
        ...r,
        tenantName: tenantStore.find((t) => t.id === r.tenantId)?.name,
        referrerName: userStore.find((u) => u.id === r.referrerId)?.fullName,
        refereeName: userStore.find((u) => u.id === r.refereeId)?.fullName,
      }));
    },
    async listByReferrer(referrerId, tenantId) {
      const filtered = referralStore.filter(
        (r) => r.referrerId === referrerId && (!tenantId || r.tenantId === tenantId)
      );
      return filtered.map((r) => ({
        ...r,
        tenantName: tenantStore.find((t) => t.id === r.tenantId)?.name,
        referrerName: userStore.find((u) => u.id === r.referrerId)?.fullName,
        refereeName: userStore.find((u) => u.id === r.refereeId)?.fullName,
      }));
    },
    async findByRefereeAndTenant(refereeId, tenantId) {
      return (
        referralStore.find(
          (r) => r.refereeId === refereeId && r.tenantId === tenantId
        ) ?? null
      );
    },
    async createPending(input) {
      const record: ReferralLedgerDTO = {
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        referrerId: input.referrerId,
        refereeId: input.refereeId,
        status: 'PENDING_COMPLETION',
        completedAt: null,
        createdAt: new Date().toISOString(),
      };
      referralStore.push(record);
      return record;
    },
    async markCompleted(id, _transactionId, completedAt) {
      const row = referralStore.find((r) => r.id === id);
      if (!row) throw new Error('Referral entry not found');
      row.status = 'COMPLETED';
      row.completedAt = completedAt.toISOString();
      return row;
    },
  };

  const vouchers: VoucherRepository = {
    async findByCode(code, tenantId) {
      return (
        voucherStore.find(
          (v) =>
            v.code === code.toUpperCase() &&
            (!tenantId || v.tenantId === tenantId) &&
            !v.redeemedAt
        ) ?? null
      );
    },
    async listByClient(clientId, tenantId) {
      return voucherStore.filter(
        (v) => v.clientId === clientId && (!tenantId || v.tenantId === tenantId)
      );
    },
    async listByTenant(tenantId) {
      return voucherStore
        .filter((v) => v.tenantId === tenantId)
        .map((v) => ({
          ...v,
          clientName: userStore.find((u) => u.id === v.clientId)?.fullName,
          clientEmail: userStore.find((u) => u.id === v.clientId)?.email,
        }));
    },
    async create(input) {
      const created: VoucherDTO = {
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        clientId: input.clientId,
        code: input.code.toUpperCase(),
        offerText: input.offerText,
        expiresAt: input.expiresAt.toISOString(),
        redeemedAt: null,
        createdAt: new Date().toISOString(),
      };
      voucherStore.push(created);
      return created;
    },
    async markRedeemed(id) {
      const v = voucherStore.find((item) => item.id === id);
      if (!v) throw new Error('Voucher not found');
      v.redeemedAt = new Date().toISOString();
      return v;
    },
  };

  return { tenants, users, visits, transactions, referrals, vouchers };
}
