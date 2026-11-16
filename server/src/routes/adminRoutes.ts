import { Router } from 'express';
import { z } from 'zod';
import { RepositoryContainer } from '../repositories/ports';
import { requireAuth, requireOwner } from '../auth/middleware';
import { AdminDomainService } from '../domain/admin/adminService';

const posCheckoutSchema = z.object({
  customerEmailOrCode: z.string().min(1),
  customerFullName: z.string().optional(),
  billAmountCents: z.number().int().positive(),
});

const voucherSchema = z.object({
  clientId: z.string().uuid(),
  offerText: z.string().trim().min(1).max(500),
  daysValid: z.number().int().min(1).max(90).default(30),
});

export function createAdminRoutes(repos: RepositoryContainer): Router {
  const router = Router();
  const adminService = new AdminDomainService(repos);

  router.use(requireAuth, requireOwner);

  // Basic cashier checkout.
  router.post('/pos/checkout', async (req, res) => {
    const parsed = posCheckoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    try {
      const result = await adminService.processPosCheckout(
        req.user!.tenantId!,
        parsed.data
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // Recent transactions at this shop
  router.get('/transactions', async (req, res) => {
    const list = await repos.transactions.listByTenant(req.user!.tenantId!);
    res.json({ transactions: list });
  });

  // Customers who have visited this shop
  router.get('/clients', async (req, res) => {
    const clients = await repos.users.listClients(req.user!.tenantId!);
    res.json({ clients });
  });

  // Create a shop-authored voucher for a customer.
  router.post('/vouchers', async (req, res) => {
    const parsed = voucherSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    try {
      const voucher = await adminService.issueVoucher(
        req.user!.tenantId!,
        parsed.data.clientId,
        parsed.data.offerText,
        parsed.data.daysValid
      );
      res.status(201).json({ voucher });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // List vouchers issued by this shop.
  router.get('/vouchers', async (req, res) => {
    const list = await repos.vouchers.listByTenant(req.user!.tenantId!);
    res.json({ vouchers: list });
  });

  return router;
}
