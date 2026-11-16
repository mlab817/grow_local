import crypto from 'crypto';
import { RepositoryContainer } from '../../repositories/ports';
import { PosCheckoutInput, PosCheckoutResult, VoucherDTO } from '@growlocal/shared';

export class AdminDomainService {
  constructor(private repos: RepositoryContainer) {}

  async processPosCheckout(
    tenantId: string,
    input: PosCheckoutInput
  ): Promise<PosCheckoutResult> {
    const tenant = await this.repos.tenants.findById(tenantId);
    if (!tenant) throw new Error('Tenant business not found');

    // Resolve the customer by their registered contact or member code.
    const identifier = input.customerEmailOrCode.trim();
    let customer =
      (await this.repos.users.findByEmail(identifier)) ||
      (await this.repos.users.findByReferralCode(identifier)) ||
      (await this.repos.users.findByPhone(identifier));

    // If customer doesn't exist yet, auto-create a member account on the spot!
    if (!customer) {
      const email = identifier.includes('@')
        ? identifier.toLowerCase()
        : `cust-${Date.now()}@growlocal.local`;
      const fullName = input.customerFullName || `Guest ${identifier.slice(0, 6)}`;
      const prefix = fullName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
      const suffix = Math.floor(100 + Math.random() * 900);
      const referralCode = `${prefix}-${suffix}`;

      customer = await this.repos.users.create({
        fullName,
        email,
        phone: identifier.includes('@') ? null : identifier,
        passwordHash: 'in-store-auto-generated',
        role: 'CLIENT',
        referralCode,
      });
    }

    const hasVisited = await this.repos.visits.hasVisited(tenantId, customer.id);
    const finalAmountCents = input.billAmountCents;

    const transaction = await this.repos.transactions.create({
      tenantId,
      clientId: customer.id,
      billAmountCents: input.billAmountCents,
      discountCents: 0,
      finalAmountCents,
    });

    await this.repos.visits.recordVisit(tenantId, customer.id);

    return {
      transaction,
      finalAmountCents,
      newCustomerVerified: !hasVisited,
    };
  }

  async issueVoucher(
    tenantId: string,
    clientId: string,
    offerText: string,
    daysValid: number = 30
  ): Promise<VoucherDTO> {
    const code = `VOUCHER-${Math.floor(100 + Math.random() * 900)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysValid);

    return this.repos.vouchers.create({
      tenantId,
      clientId,
      code,
      offerText,
      expiresAt,
    });
  }
}
