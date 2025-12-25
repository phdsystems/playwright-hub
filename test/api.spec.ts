import { test, expect } from 'playwright/test';

const testRunPayload = {
  appId: 'test-app',
  suite: 'smoke',
  environment: 'staging',
  status: 'passed' as const,
  total: 10,
  passed: 10,
  failed: 0,
  durationMs: 5000,
  coverage: 85,
  commit: 'abc123',
};

test.describe('API /api/runs', () => {
  test('POST /api/runs creates a new test run', async ({ request }) => {
    const response = await request.post('/api/runs', {
      data: testRunPayload,
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.id).toBeDefined();
    expect(body.appId).toBe(testRunPayload.appId);
    expect(body.suite).toBe(testRunPayload.suite);
    expect(body.status).toBe(testRunPayload.status);
    expect(body.createdAt).toBeDefined();
  });

  test('GET /api/runs returns list of runs', async ({ request }) => {
    const response = await request.get('/api/runs');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /api/runs validates required fields', async ({ request }) => {
    const response = await request.post('/api/runs', {
      data: { appId: 'test' }, // missing required fields
    });

    expect(response.status()).toBe(400);
  });

  test('POST /api/runs with failed status', async ({ request }) => {
    const failedRun = {
      ...testRunPayload,
      status: 'failed' as const,
      passed: 8,
      failed: 2,
    };

    const response = await request.post('/api/runs', {
      data: failedRun,
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.status).toBe('failed');
    expect(body.failed).toBe(2);
  });
});

test.describe('API /api/metrics', () => {
  test('GET /api/metrics/prometheus returns prometheus format', async ({ request }) => {
    const response = await request.get('/api/metrics/prometheus');

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/plain');
  });
});
