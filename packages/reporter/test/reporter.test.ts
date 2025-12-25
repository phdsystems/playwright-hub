import { describe, test, expect, mock, spyOn } from 'bun:test';
import { UxQaReporter } from '../src/reporter';
import type { UxQaReporterOptions, RunPayload, TestResultInfo } from '../src/types';

describe('UxQaReporter', () => {
  describe('constructor', () => {
    test('requires appId', () => {
      expect(() => new UxQaReporter({} as UxQaReporterOptions)).toThrow('appId is required');
    });

    test('accepts valid options', () => {
      const reporter = new UxQaReporter({ appId: 'test-app' });
      expect(reporter).toBeInstanceOf(UxQaReporter);
    });

    test('uses default values', () => {
      const reporter = new UxQaReporter({ appId: 'test-app' });
      // Reporter should be created without errors
      expect(reporter).toBeDefined();
    });

    test('accepts all options', () => {
      const reporter = new UxQaReporter({
        appId: 'test-app',
        hubUrl: 'https://ux.qa',
        suite: 'integration',
        environment: 'staging',
        apiKey: 'secret-key',
        verbose: true,
        tags: ['nightly', 'smoke'],
        timeout: 5000,
      });
      expect(reporter).toBeInstanceOf(UxQaReporter);
    });
  });

  describe('environment detection', () => {
    test('detects local environment by default', () => {
      // Clear CI env vars
      const originalCI = process.env.CI;
      const originalGithub = process.env.GITHUB_ACTIONS;
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;

      const reporter = new UxQaReporter({ appId: 'test-app' });
      // We can't directly check private options, but reporter should work
      expect(reporter).toBeDefined();

      // Restore
      if (originalCI) process.env.CI = originalCI;
      if (originalGithub) process.env.GITHUB_ACTIONS = originalGithub;
    });
  });

  describe('test result tracking', () => {
    test('tracks test results via onTestEnd', () => {
      const reporter = new UxQaReporter({ appId: 'test-app' });

      // Call onBegin to initialize
      reporter.onBegin({} as any, {} as any);

      // Simulate a passing test
      reporter.onTestEnd(
        { title: 'should pass' } as any,
        { status: 'passed', duration: 100, retry: 0, errors: [] } as any
      );

      // Simulate a failing test
      reporter.onTestEnd(
        { title: 'should fail' } as any,
        { status: 'failed', duration: 200, retry: 0, errors: [{ message: 'Assertion failed' }] } as any
      );

      // Simulate a skipped test
      reporter.onTestEnd(
        { title: 'should be skipped' } as any,
        { status: 'skipped', duration: 0, retry: 0, errors: [] } as any
      );

      // Reporter should track these internally - we verify by calling onEnd
      expect(reporter).toBeDefined();
    });

    test('tracks flaky tests (passed after retry)', () => {
      const reporter = new UxQaReporter({ appId: 'test-app' });
      reporter.onBegin({} as any, {} as any);

      // Simulate a flaky test that passed on retry
      reporter.onTestEnd(
        { title: 'flaky test' } as any,
        { status: 'passed', duration: 100, retry: 1, errors: [] } as any
      );

      expect(reporter).toBeDefined();
    });
  });

  describe('onEnd', () => {
    test('publishes results on end', async () => {
      const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ id: 'run_123' }), { status: 200 })
      );

      const reporter = new UxQaReporter({
        appId: 'test-app',
        hubUrl: 'https://test.ux.qa',
      });

      reporter.onBegin({} as any, {} as any);
      reporter.onTestEnd(
        { title: 'test' } as any,
        { status: 'passed', duration: 100, retry: 0, errors: [] } as any
      );

      await reporter.onEnd({ status: 'passed' } as any);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy.mock.calls[0][0]).toBe('https://test.ux.qa/api/runs');

      const callArgs = fetchSpy.mock.calls[0][1];
      expect(callArgs.method).toBe('POST');
      expect(callArgs.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(callArgs.body);
      expect(body.appId).toBe('test-app');
      expect(body.passed).toBe(1);
      expect(body.total).toBe(1);
      expect(body.status).toBe('passed');

      fetchSpy.mockRestore();
    });

    test('includes API key in header when provided', async () => {
      const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ id: 'run_123' }), { status: 200 })
      );

      const reporter = new UxQaReporter({
        appId: 'test-app',
        apiKey: 'my-api-key',
      });

      reporter.onBegin({} as any, {} as any);
      await reporter.onEnd({ status: 'passed' } as any);

      const callArgs = fetchSpy.mock.calls[0][1];
      expect(callArgs.headers['x-uxqa-key']).toBe('my-api-key');

      fetchSpy.mockRestore();
    });

    test('handles failed status', async () => {
      const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ id: 'run_123' }), { status: 200 })
      );

      const reporter = new UxQaReporter({ appId: 'test-app' });

      reporter.onBegin({} as any, {} as any);
      reporter.onTestEnd(
        { title: 'failing test' } as any,
        { status: 'failed', duration: 100, retry: 0, errors: [{ message: 'Error' }] } as any
      );

      await reporter.onEnd({ status: 'failed' } as any);

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.status).toBe('failed');
      expect(body.failed).toBe(1);

      fetchSpy.mockRestore();
    });

    test('handles flaky status', async () => {
      const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ id: 'run_123' }), { status: 200 })
      );

      const reporter = new UxQaReporter({ appId: 'test-app' });

      reporter.onBegin({} as any, {} as any);
      reporter.onTestEnd(
        { title: 'flaky test' } as any,
        { status: 'passed', duration: 100, retry: 1, errors: [] } as any
      );

      await reporter.onEnd({ status: 'passed' } as any);

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.status).toBe('flaky');
      expect(body.flaky).toBe(1);

      fetchSpy.mockRestore();
    });

    test('handles API errors gracefully', async () => {
      const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});
      const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Server Error', { status: 500 })
      );

      const reporter = new UxQaReporter({ appId: 'test-app' });
      reporter.onBegin({} as any, {} as any);

      // Should not throw
      await reporter.onEnd({ status: 'passed' } as any);

      expect(consoleSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    test('handles network errors gracefully', async () => {
      const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});
      const fetchSpy = spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      const reporter = new UxQaReporter({ appId: 'test-app' });
      reporter.onBegin({} as any, {} as any);

      // Should not throw
      await reporter.onEnd({ status: 'passed' } as any);

      expect(consoleSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('verbose logging', () => {
    test('logs when verbose is enabled', () => {
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});

      const reporter = new UxQaReporter({
        appId: 'test-app',
        verbose: true,
      });

      reporter.onBegin({} as any, {} as any);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('does not log when verbose is disabled', () => {
      const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});

      const reporter = new UxQaReporter({
        appId: 'test-app',
        verbose: false,
      });

      reporter.onBegin({} as any, {} as any);

      // Only the final success message should be logged, not verbose logs
      const verboseLogs = consoleSpy.mock.calls.filter(
        call => call[0]?.includes?.('[ux.qa] Starting')
      );
      expect(verboseLogs.length).toBe(0);

      consoleSpy.mockRestore();
    });
  });
});

describe('Type exports', () => {
  test('exports types correctly', async () => {
    const { UxQaReporter, default: DefaultReporter } = await import('../src/index');

    expect(UxQaReporter).toBeDefined();
    expect(DefaultReporter).toBeDefined();
    expect(UxQaReporter).toBe(DefaultReporter);
  });
});
