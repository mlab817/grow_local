import express from 'express';
import cors from 'cors';
import { RepositoryContainer } from './repositories/ports';
import { createAuthRoutes } from './routes/authRoutes';
import { createAdminRoutes } from './routes/adminRoutes';
import { createCustomerRoutes } from './routes/customerRoutes';

export function createApp(repos: RepositoryContainer) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'growlocal-api' });
  });

  app.use('/api/auth', createAuthRoutes(repos));
  app.use('/api/admin', createAdminRoutes(repos));
  app.use('/api/customer', createCustomerRoutes(repos));

  return app;
}
