import { describe, test, expect } from 'bun:test';
import { calculateCoverage, generateJsonReport } from '../src/reporters/coverage';
import type { ComponentInfo, ScanResult } from '../src/types';

describe('Coverage Reporter', () => {
  const createMockComponent = (overrides: Partial<ComponentInfo> = {}): ComponentInfo => ({
    filePath: 'src/Component.tsx',
    name: 'Component',
    framework: 'react',
    elements: [],
    props: [],
    routes: [],
    hasTests: false,
    ...overrides,
  });

  describe('calculateCoverage', () => {
    test('should return zero coverage for empty components', () => {
      const coverage = calculateCoverage([]);

      expect(coverage.totalComponents).toBe(0);
      expect(coverage.testedComponents).toBe(0);
      expect(coverage.totalElements).toBe(0);
      expect(coverage.elementsWithTestId).toBe(0);
      expect(coverage.totalRoutes).toBe(0);
      expect(coverage.testedRoutes).toBe(0);
    });

    test('should count total components', () => {
      const components = [
        createMockComponent({ name: 'A' }),
        createMockComponent({ name: 'B' }),
        createMockComponent({ name: 'C' }),
      ];

      const coverage = calculateCoverage(components);

      expect(coverage.totalComponents).toBe(3);
    });

    test('should count tested components', () => {
      const components = [
        createMockComponent({ name: 'A', hasTests: true }),
        createMockComponent({ name: 'B', hasTests: false }),
        createMockComponent({ name: 'C', hasTests: true }),
      ];

      const coverage = calculateCoverage(components);

      expect(coverage.testedComponents).toBe(2);
    });

    test('should count total elements', () => {
      const components = [
        createMockComponent({
          elements: [
            { type: 'button', suggestedTestId: 'btn', line: 1, handlers: [] },
            { type: 'input', suggestedTestId: 'input', line: 2, handlers: [] },
          ],
        }),
        createMockComponent({
          elements: [
            { type: 'link', suggestedTestId: 'link', line: 1, handlers: [] },
          ],
        }),
      ];

      const coverage = calculateCoverage(components);

      expect(coverage.totalElements).toBe(3);
    });

    test('should count elements with testId', () => {
      const components = [
        createMockComponent({
          elements: [
            { type: 'button', testId: 'btn-1', suggestedTestId: 'btn-1', line: 1, handlers: [] },
            { type: 'input', suggestedTestId: 'input', line: 2, handlers: [] }, // no testId
            { type: 'link', testId: 'link-1', suggestedTestId: 'link-1', line: 3, handlers: [] },
          ],
        }),
      ];

      const coverage = calculateCoverage(components);

      expect(coverage.elementsWithTestId).toBe(2);
    });

    test('should count unique routes', () => {
      const components = [
        createMockComponent({ routes: ['/home', '/about'] }),
        createMockComponent({ routes: ['/about', '/contact'] }), // /about is duplicate
      ];

      const coverage = calculateCoverage(components);

      expect(coverage.totalRoutes).toBe(3); // /home, /about, /contact
    });

    test('should count tested routes', () => {
      const components = [
        createMockComponent({ routes: ['/home'], hasTests: true }),
        createMockComponent({ routes: ['/about'], hasTests: false }),
        createMockComponent({ routes: ['/contact'], hasTests: true }),
      ];

      const coverage = calculateCoverage(components);

      expect(coverage.testedRoutes).toBe(2);
    });
  });

  describe('generateJsonReport', () => {
    test('should generate valid JSON', () => {
      const result: ScanResult = {
        components: [createMockComponent()],
        routes: [{ path: '/', component: 'Component', hasTests: false }],
        coverage: {
          totalComponents: 1,
          testedComponents: 0,
          totalElements: 0,
          elementsWithTestId: 0,
          totalRoutes: 1,
          testedRoutes: 0,
        },
        warnings: [],
      };

      const json = generateJsonReport(result);
      const parsed = JSON.parse(json);

      expect(parsed).toBeDefined();
      expect(parsed.coverage).toBeDefined();
      expect(parsed.components).toBeArray();
    });

    test('should include timestamp', () => {
      const result: ScanResult = {
        components: [],
        routes: [],
        coverage: {
          totalComponents: 0,
          testedComponents: 0,
          totalElements: 0,
          elementsWithTestId: 0,
          totalRoutes: 0,
          testedRoutes: 0,
        },
        warnings: [],
      };

      const json = generateJsonReport(result);
      const parsed = JSON.parse(json);

      expect(parsed.timestamp).toBeDefined();
      // Should be valid ISO date
      expect(new Date(parsed.timestamp).toISOString()).toBe(parsed.timestamp);
    });

    test('should include coverage stats', () => {
      const result: ScanResult = {
        components: [],
        routes: [],
        coverage: {
          totalComponents: 10,
          testedComponents: 5,
          totalElements: 50,
          elementsWithTestId: 30,
          totalRoutes: 8,
          testedRoutes: 4,
        },
        warnings: [],
      };

      const json = generateJsonReport(result);
      const parsed = JSON.parse(json);

      expect(parsed.coverage.totalComponents).toBe(10);
      expect(parsed.coverage.testedComponents).toBe(5);
      expect(parsed.coverage.totalElements).toBe(50);
      expect(parsed.coverage.elementsWithTestId).toBe(30);
    });

    test('should include component details', () => {
      const result: ScanResult = {
        components: [
          createMockComponent({
            name: 'TestComponent',
            filePath: 'src/TestComponent.tsx',
            hasTests: true,
            testFilePath: 'tests/TestComponent.test.ts',
            elements: [
              { type: 'button', testId: 'btn', suggestedTestId: 'btn', line: 1, handlers: [] },
              { type: 'input', suggestedTestId: 'input', line: 2, handlers: [] },
            ],
            routes: ['/test'],
          }),
        ],
        routes: [],
        coverage: {
          totalComponents: 1,
          testedComponents: 1,
          totalElements: 2,
          elementsWithTestId: 1,
          totalRoutes: 1,
          testedRoutes: 1,
        },
        warnings: [],
      };

      const json = generateJsonReport(result);
      const parsed = JSON.parse(json);

      expect(parsed.components).toHaveLength(1);
      expect(parsed.components[0].name).toBe('TestComponent');
      expect(parsed.components[0].hasTests).toBe(true);
      expect(parsed.components[0].elementCount).toBe(2);
      expect(parsed.components[0].elementsWithTestId).toBe(1);
    });

    test('should include suggestions for missing testIds', () => {
      const result: ScanResult = {
        components: [
          createMockComponent({
            elements: [
              { type: 'button', suggestedTestId: 'submit-btn', line: 10, handlers: [] },
              { type: 'input', suggestedTestId: 'email-input', line: 15, handlers: [] },
            ],
          }),
        ],
        routes: [],
        coverage: {
          totalComponents: 1,
          testedComponents: 0,
          totalElements: 2,
          elementsWithTestId: 0,
          totalRoutes: 0,
          testedRoutes: 0,
        },
        warnings: [],
      };

      const json = generateJsonReport(result);
      const parsed = JSON.parse(json);

      expect(parsed.suggestions).toHaveLength(2);
      expect(parsed.suggestions[0].suggestedTestId).toBe('submit-btn');
      expect(parsed.suggestions[0].line).toBe(10);
    });

    test('should include warnings', () => {
      const result: ScanResult = {
        components: [],
        routes: [],
        coverage: {
          totalComponents: 0,
          testedComponents: 0,
          totalElements: 0,
          elementsWithTestId: 0,
          totalRoutes: 0,
          testedRoutes: 0,
        },
        warnings: ['Warning 1', 'Warning 2'],
      };

      const json = generateJsonReport(result);
      const parsed = JSON.parse(json);

      expect(parsed.warnings).toHaveLength(2);
      expect(parsed.warnings).toContain('Warning 1');
    });
  });
});
