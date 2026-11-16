import bcrypt from 'bcryptjs';
import { db, pool } from './index';
import {
  referralLedger,
  tenants,
  tenantVisits,
  transactions,
  users,
  winbackVouchers,
} from './schema';

async function seed() {
  console.log('Seeding GrowLocal Marinduque Social Enterprise Network...');

  await db.delete(winbackVouchers);
  await db.delete(referralLedger);
  await db.delete(transactions);
  await db.delete(tenantVisits);
  await db.delete(users);
  await db.delete(tenants);

  // 1. Create Participating Local Businesses in Marinduque
  const [downtownTenant, metroTenant, cafeTenant] = await db
    .insert(tenants)
    .values([
      {
        name: 'Downtown Studio & Spa',
        slug: 'downtown-spa',
        category: 'Hair & Wellness',
        description: 'Boutique hair styling, skincare & therapeutic massage.',
        town: 'Boac',
        rewardOffer: 'Referral rewards coming soon',
        minBillCents: 30000,
      },
      {
        name: 'Metro Auto & Detailing',
        slug: 'metro-auto',
        category: 'Auto Care',
        description: 'Express car detailing, interior steam wash & paint protection.',
        town: 'Gasan',
        rewardOffer: 'Referral rewards coming soon',
        minBillCents: 50000,
      },
      {
        name: 'Moriones Heritage Cafe',
        slug: 'heritage-cafe',
        category: 'Cafe & Dining',
        description: 'Artisan native coffee, local Marinduque pastries and dining.',
        town: 'Mogpog',
        rewardOffer: 'Referral rewards coming soon',
        minBillCents: 20000,
      },
    ])
    .returning();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Create Shop Owners and Universal Clients
  const [ownerDowntown, ownerMetro, ownerCafe, maria, carlo, sofia] = await db
    .insert(users)
    .values([
      // Shop Owners (tied to their specific shop)
      {
        tenantId: downtownTenant.id,
        fullName: 'Elena Cruz (Downtown Owner)',
        email: 'owner@growlocal.local',
        phone: '+63 917 100 0001',
        passwordHash,
        role: 'OWNER',
        referralCode: 'DOWNTOWN-001',
      },
      {
        tenantId: metroTenant.id,
        fullName: 'Marcus Vance (Metro Owner)',
        email: 'metro.owner@growlocal.local',
        phone: '+63 917 600 0006',
        passwordHash,
        role: 'OWNER',
        referralCode: 'METRO-001',
      },
      {
        tenantId: cafeTenant.id,
        fullName: 'Clarissa Reyes (Cafe Owner)',
        email: 'cafe.owner@growlocal.local',
        phone: '+63 917 800 0008',
        passwordHash,
        role: 'OWNER',
        referralCode: 'CAFE-001',
      },
      // Customer accounts.
      {
        tenantId: null,
        fullName: 'Maria Santos',
        email: 'maria@growlocal.local',
        phone: '+63 917 200 0002',
        passwordHash,
        role: 'CLIENT',
        referralCode: 'MARIA-001',
      },
      {
        tenantId: null,
        fullName: 'Carlo Reyes',
        email: 'carlo@growlocal.local',
        phone: '+63 917 300 0003',
        passwordHash,
        role: 'CLIENT',
        referralCode: 'CARLO-001',
      },
      {
        tenantId: null,
        fullName: 'Sofia Mendoza',
        email: 'sofia@growlocal.local',
        phone: '+63 917 400 0004',
        passwordHash,
        role: 'CLIENT',
        referralCode: 'SOFIA-202',
      },
    ])
    .returning();

  // 3. Seed visit records for the customer portal.
  await db.insert(tenantVisits).values([
    {
      tenantId: downtownTenant.id,
      clientId: maria.id,
      visitCount: 2,
    },
    {
      tenantId: downtownTenant.id,
      clientId: carlo.id,
      visitCount: 1,
    },
    {
      tenantId: cafeTenant.id,
      clientId: sofia.id,
      visitCount: 3,
    },
  ]);

  // 4. Seed a basic cashier transaction.
  await db
    .insert(transactions)
    .values([
      {
        tenantId: downtownTenant.id,
        clientId: carlo.id,
        billAmountCents: 150000,
        discountCents: 0,
        finalAmountCents: 150000,
      },
    ])

  console.log('Seed completed successfully.');
  console.log('Participating Shops in Marinduque:');
  console.log(`  1. ${downtownTenant.name} (${downtownTenant.town}) - ${downtownTenant.rewardOffer}`);
  console.log(`  2. ${metroTenant.name} (${metroTenant.town}) - ${metroTenant.rewardOffer}`);
  console.log(`  3. ${cafeTenant.name} (${cafeTenant.town}) - ${cafeTenant.rewardOffer}`);
  console.log('Demo Accounts:');
  console.log('  Shop Owner (Boac):  owner@growlocal.local / password123');
  console.log('  Customer (Maria):   maria@growlocal.local / password123');
  console.log('  Customer (Carlo):   carlo@growlocal.local / password123');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
