import {
  CustomerShopStatusDTO,
  ReferralLedgerDTO,
  Role,
  TenantDTO,
  TransactionDTO,
  UserDTO,
  VoucherDTO,
} from '@growlocal/shared';

export interface UserRecord extends UserDTO {
  passwordHash: string;
}

export interface CreateUserInput {
  tenantId?: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  role: Role;
  referralCode: string;
}

export interface TenantRepository {
  listAll(): Promise<TenantDTO[]>;
  findById(id: string): Promise<TenantDTO | null>;
  findBySlug(slug: string): Promise<TenantDTO | null>;
  create(input: {
    name: string;
    slug: string;
    category?: string;
    description?: string;
    town?: string;
    rewardOffer?: string;
    minBillCents?: number;
  }): Promise<TenantDTO>;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  findByReferralCode(code: string): Promise<UserRecord | null>;
  findByPhone(phone: string): Promise<UserRecord | null>;
  listClients(tenantId?: string): Promise<UserDTO[]>;
  create(input: CreateUserInput): Promise<UserRecord>;
}

export interface VisitRepository {
  hasVisited(tenantId: string, clientId: string): Promise<boolean>;
  recordVisit(tenantId: string, clientId: string): Promise<{ visitCount: number }>;
  listCustomerShops(clientId: string): Promise<CustomerShopStatusDTO[]>;
}

export interface TransactionRepository {
  create(input: {
    tenantId: string;
    clientId: string;
    billAmountCents: number;
    discountCents: number;
    finalAmountCents: number;
    referralCodeUsed?: string;
  }): Promise<TransactionDTO>;
  listByTenant(tenantId: string): Promise<TransactionDTO[]>;
  listByClient(clientId: string): Promise<TransactionDTO[]>;
}

export interface ReferralRepository {
  listAll(tenantId?: string): Promise<ReferralLedgerDTO[]>;
  listByReferrer(referrerId: string, tenantId?: string): Promise<ReferralLedgerDTO[]>;
  findByRefereeAndTenant(refereeId: string, tenantId: string): Promise<ReferralLedgerDTO | null>;
  createPending(input: {
    tenantId: string;
    referrerId: string;
    refereeId: string;
  }): Promise<ReferralLedgerDTO>;
  markCompleted(id: string, transactionId: string, completedAt: Date): Promise<ReferralLedgerDTO>;
}

export interface VoucherRepository {
  findByCode(code: string, tenantId?: string): Promise<VoucherDTO | null>;
  listByClient(clientId: string, tenantId?: string): Promise<VoucherDTO[]>;
  listByTenant(tenantId: string): Promise<VoucherDTO[]>;
  create(input: {
    tenantId: string;
    clientId: string;
    code: string;
    offerText: string;
    expiresAt: Date;
  }): Promise<VoucherDTO>;
  markRedeemed(id: string): Promise<VoucherDTO>;
}

export interface RepositoryContainer {
  tenants: TenantRepository;
  users: UserRepository;
  visits: VisitRepository;
  transactions: TransactionRepository;
  referrals: ReferralRepository;
  vouchers: VoucherRepository;
}
