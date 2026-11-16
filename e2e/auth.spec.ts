import { test, expect } from '@playwright/test';

test.describe('Role-Based Authentication & Routing', () => {
  test('logs in as Demo Owner and lands on Cashier & Owner Terminal', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Demo Owner (Admin)' }).click();
    await expect(page.getByText('Cashier & Owner Terminal')).toBeVisible();
    await expect(page.getByText('Cashier POS & Checkout')).toBeVisible();
  });

  test('logs in as Demo Client and lands on Member Portal', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Demo Client (Maria)' }).click();
    await expect(page.getByText('Member Portal')).toBeVisible();
    await expect(page.getByText('Participating Shops in Marinduque')).toBeVisible();
  });
});
