import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { createInMemoryRepositories } from '../src/repositories/inMemoryRepository';
import { RepositoryContainer } from '../src/repositories/ports';

describe('GrowLocal basic customer and checkout flows', () => {
  let repos: RepositoryContainer;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    repos = createInMemoryRepositories();
    app = createApp(repos);
  });

  it('allows a customer to register and browse participating shops', async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      fullName: 'Tourist Juan',
      email: 'juan@example.com',
      password: 'password123',
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.user.role).toBe('CLIENT');
    expect(regRes.body.user.tenantId).toBeNull();

    const shopsRes = await request(app)
      .get('/api/customer/shops')
      .set('Authorization', `Bearer ${regRes.body.token}`);

    expect(shopsRes.status).toBe(200);
    expect(shopsRes.body.shops.length).toBeGreaterThan(0);
    expect(shopsRes.body.shops[0].isVerifiedVisitor).toBe(false);
  });

  it('records a basic cashier checkout and updates visit and transaction history', async () => {
    const shop = await repos.tenants.create({
      name: 'Boac Artisan Bakery',
      slug: 'boac-bakery',
      town: 'Boac',
    });

    const ownerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Owner Teresa',
      email: 'teresa@bakery.local',
      password: 'password123',
      tenantId: shop.id,
    });

    const customerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Maria Santos',
      email: 'maria@example.com',
      password: 'password123',
    });

    const checkoutRes = await request(app)
      .post('/api/admin/pos/checkout')
      .set('Authorization', `Bearer ${ownerRes.body.token}`)
      .send({
        customerEmailOrCode: customerRes.body.user.email,
        billAmountCents: 50000,
      });

    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.body.transaction.billAmountCents).toBe(50000);
    expect(checkoutRes.body.transaction.discountCents).toBe(0);
    expect(checkoutRes.body.finalAmountCents).toBe(50000);
    expect(checkoutRes.body.newCustomerVerified).toBe(true);

    const shopsRes = await request(app)
      .get('/api/customer/shops')
      .set('Authorization', `Bearer ${customerRes.body.token}`);
    const visitedShop = shopsRes.body.shops.find(
      (item: { tenantId: string }) => item.tenantId === shop.id
    );
    expect(visitedShop.isVerifiedVisitor).toBe(true);

    const transactionsRes = await request(app)
      .get('/api/customer/transactions')
      .set('Authorization', `Bearer ${customerRes.body.token}`);
    expect(transactionsRes.body.transactions).toHaveLength(1);
    expect(transactionsRes.body.transactions[0].finalAmountCents).toBe(50000);
  });

  it('stores shop-authored voucher terms without calculating a discount', async () => {
    const shop = await repos.tenants.create({
      name: 'Boac Artisan Bakery',
      slug: 'boac-bakery',
      town: 'Boac',
    });

    const ownerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Owner Teresa',
      email: 'teresa@bakery.local',
      password: 'password123',
      tenantId: shop.id,
    });

    const customerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Maria Santos',
      email: 'maria@example.com',
      password: 'password123',
    });

    const voucherRes = await request(app)
      .post('/api/admin/vouchers')
      .set('Authorization', `Bearer ${ownerRes.body.token}`)
      .send({
        clientId: customerRes.body.user.id,
        offerText: '10% off rebond (up to ₱100)',
      });

    expect(voucherRes.status).toBe(201);
    expect(voucherRes.body.voucher.offerText).toBe('10% off rebond (up to ₱100)');
    expect(voucherRes.body.voucher.code).toMatch(/^VOUCHER-/);
  });
});
