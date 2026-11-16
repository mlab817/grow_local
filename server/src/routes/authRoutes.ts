import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { RepositoryContainer } from '../repositories/ports';
import { requireAuth, signToken } from '../auth/middleware';

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  tenantId: z.string().uuid().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function generateReferralCode(fullName: string): string {
  const prefix = fullName
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 5)
    .padEnd(4, 'X');
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${suffix}`;
}

export function createAuthRoutes(repos: RepositoryContainer): Router {
  const router = Router();

  // Public: List all participating shops in Marinduque
  router.get('/tenants', async (_req, res) => {
    const list = await repos.tenants.listAll();
    res.json({ tenants: list });
  });

  // Universal registration: Users can sign up from anywhere
  router.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const existing = await repos.users.findByEmail(parsed.data.email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const created = await repos.users.create({
      tenantId: parsed.data.tenantId ?? null,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      passwordHash,
      role: parsed.data.tenantId ? 'OWNER' : 'CLIENT',
      referralCode: generateReferralCode(parsed.data.fullName),
    });

    const token = signToken({
      userId: created.id,
      email: created.email,
      role: created.role,
      tenantId: created.tenantId,
    });

    let tenant = undefined;
    if (created.tenantId) {
      tenant = (await repos.tenants.findById(created.tenantId)) ?? undefined;
    }

    const { passwordHash: _, ...user } = created;
    res.status(201).json({ token, user, tenant });
  });

  router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid credentials format' });
      return;
    }

    const userRecord = await repos.users.findByEmail(parsed.data.email);
    if (!userRecord) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(parsed.data.password, userRecord.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signToken({
      userId: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
      tenantId: userRecord.tenantId,
    });

    let tenant = undefined;
    if (userRecord.tenantId) {
      tenant = (await repos.tenants.findById(userRecord.tenantId)) ?? undefined;
    }

    const { passwordHash: _, ...user } = userRecord;
    res.json({ token, user, tenant });
  });

  router.get('/me', requireAuth, async (req, res) => {
    const userRecord = await repos.users.findById(req.user!.userId);
    if (!userRecord) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    let tenant = undefined;
    if (userRecord.tenantId) {
      tenant = (await repos.tenants.findById(userRecord.tenantId)) ?? undefined;
    }
    const { passwordHash: _, ...user } = userRecord;
    res.json({ user, tenant });
  });

  return router;
}
