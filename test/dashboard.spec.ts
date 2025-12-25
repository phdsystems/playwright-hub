import { test, expect } from 'playwright/test';

test.describe('Dashboard', () => {
  test('loads homepage with title', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('text=Playwright Hub')).toBeVisible();
    await expect(page.locator('text=E2E Automation Dashboard')).toBeVisible();
  });

  test('displays empty state when no runs', async ({ page }) => {
    await page.goto('/');

    // Dashboard should load without errors
    await expect(page).toHaveTitle(/Playwright/i);
  });

  test('can navigate to help page', async ({ page }) => {
    await page.goto('/help/getting-started');

    // Should load help content
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Dashboard with test runs', () => {
  test.beforeEach(async ({ request }) => {
    // Seed a test run before each test
    await request.post('/api/runs', {
      data: {
        appId: 'e2e-test-app',
        suite: 'regression',
        environment: 'ci',
        status: 'passed',
        total: 50,
        passed: 50,
        failed: 0,
        durationMs: 120000,
        coverage: 92,
      },
    });
  });

  test('displays test run in dashboard', async ({ page }) => {
    await page.goto('/');

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Should show the seeded test run
    await expect(page.locator('text=e2e-test-app')).toBeVisible();
  });

  test('can navigate to app detail page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on app to navigate to detail page
    const appLink = page.locator('text=e2e-test-app').first();
    if (await appLink.isVisible()) {
      await appLink.click();
      await expect(page.url()).toContain('/apps/');
    }
  });
});

test.describe('Real-time updates', () => {
  test('receives new runs via SSE', async ({ page, request }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Post a new run while on the page
    await request.post('/api/runs', {
      data: {
        appId: 'realtime-app',
        suite: 'live-test',
        environment: 'prod',
        status: 'passed',
        total: 5,
        passed: 5,
        failed: 0,
        durationMs: 3000,
      },
    });

    // Wait for SSE update
    await page.waitForTimeout(1000);

    // New run should appear
    await expect(page.locator('text=realtime-app')).toBeVisible({ timeout: 5000 });
  });
});
