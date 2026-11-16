export type Role = 'OWNER' | 'CLIENT';

export type ReferralStatus = 'PENDING_COMPLETION' | 'COMPLETED' | 'VOIDED';

export interface TenantDTO {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  town: string;
  rewardOffer: string;
  minBillCents: number;
  createdAt: string;
}

export interface UserDTO {
  id: string;
  tenantId?: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  referralCode: string;
  createdAt: string;
}

export interface CustomerShopStatusDTO {
  tenantId: string;
  tenantName: string;
  town: string;
  category: string;
  rewardOffer: string;
  isVerifiedVisitor: boolean;
  visitCount: number;
  lastVisitedAt: string | null;
}

export interface TransactionDTO {
  id: string;
  tenantId: string;
  clientId: string;
  clientName?: string;
  billAmountCents: number;
  discountCents: number;
  finalAmountCents: number;
  referralCodeUsed?: string | null;
  createdAt: string;
}

export interface ReferralLedgerDTO {
  id: string;
  tenantId: string;
  tenantName?: string;
  referrerId: string;
  referrerName?: string;
  refereeId: string;
  refereeName?: string;
  status: ReferralStatus;
  completedAt: string | null;
  createdAt: string;
}

export interface VoucherDTO {
  id: string;
  tenantId: string;
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  code: string;
  offerText: string;
  expiresAt: string;
  redeemedAt: string | null;
  createdAt: string;
}

export interface PosCheckoutInput {
  customerEmailOrCode: string;
  customerFullName?: string;
  billAmountCents: number;
}

export interface PosCheckoutResult {
  transaction: TransactionDTO;
  finalAmountCents: number;
  newCustomerVerified: boolean;
}

export interface AuthResponse {
  token: string;
  user: UserDTO;
  tenant?: TenantDTO;
}
