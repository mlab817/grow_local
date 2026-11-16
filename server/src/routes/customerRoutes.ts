import { Router } from 'express';
import { RepositoryContainer } from '../repositories/ports';
import { requireAuth } from '../auth/middleware';
import { CustomerDomainService } from '../domain/customer/customerService';

export function createCustomerRoutes(repos: RepositoryContainer): Router {
  const router = Router();
  const customerService = new CustomerDomainService(repos);

  // Authenticated: List participating shops and recorded visits.
  router.get('/shops', requireAuth, async (req, res) => {
    const shops = await customerService.getCustomerShops(req.user!.userId);
    res.json({ shops });
  });

  // Authenticated: User's transaction history
  router.get('/transactions', requireAuth, async (req, res) => {
    const transactions = await repos.transactions.listByClient(req.user!.userId);
    res.json({ transactions });
  });

  return router;
}
