import { test, expect } from '@playwright/test';

test('Login flow: Login → Admin Dashboard → Org → Bot Settings', async ({ page }) => {
    // 1. Navigate to login page
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);

    // 2. Login form is visible
    await expect(page.locator('h1')).toContainText('BotControl');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    // 3. Fill in demo credentials (against local Supabase)
    const email = process.env.E2E_TEST_EMAIL ?? 'demo@botcontrol.local';
    const password = process.env.E2E_TEST_PASSWORD ?? 'password123';
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.locator('[type="submit"]').click();

    // 4. After login, we should reach admin dashboard or org
    await page.waitForURL(/\/(admin|org)/);
    await expect(page.locator('nav')).toBeVisible();
});
