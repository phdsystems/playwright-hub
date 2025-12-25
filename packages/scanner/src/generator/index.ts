/**
 * Test Generator - Supports multiple test strategies
 *
 * - E2E: End-to-end tests using Playwright (browser automation)
 * - Component: Component tests using @ux.qa/frontmock
 * - Integration: Integration tests for APIs, hooks, and services
 */

export { generateTestFile as generateE2ETest } from './e2e/playwright-template';
export { generateComponentTest } from './component/component-template';
export { generateIntegrationTest } from './integration/integration-template';

export type TestType = 'e2e' | 'component' | 'integration' | 'all';

/**
 * Main generator function that routes to appropriate test type
 */
import type { ComponentInfo, GeneratedTest, TestGeneratorOptions } from '../types';

export function generateTestFile(
  component: ComponentInfo,
  options: Partial<TestGeneratorOptions> & { type?: TestType } = {},
  baseUrl?: string
): GeneratedTest | GeneratedTest[] {
  const testType = options.type || 'component'; // Default to component tests

  const { generateE2ETest } = require('./e2e/playwright-template');
  const { generateComponentTest } = require('./component/component-template');
  const { generateIntegrationTest } = require('./integration/integration-template');

  switch (testType) {
    case 'e2e':
      return generateE2ETest(component, options, baseUrl);

    case 'component':
      return generateComponentTest(component, options);

    case 'integration':
      return generateIntegrationTest(component, options);

    case 'all':
      // Generate all three types
      return [
        generateComponentTest(component, options),
        generateIntegrationTest(component, options),
        generateE2ETest(component, options, baseUrl),
      ];

    default:
      return generateComponentTest(component, options);
  }
}
