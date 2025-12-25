import { describe, test, expect } from 'bun:test';
import { join } from 'path';
import { createScanner, Scanner } from '../src/scanner';

const FIXTURES_DIR = join(import.meta.dir, 'fixtures');

describe('Scanner', () => {
  describe('createScanner', () => {
    test('should create scanner with default config', () => {
      const scanner = createScanner();

      expect(scanner).toBeInstanceOf(Scanner);
    });

    test('should create scanner with custom config', () => {
      const scanner = createScanner({
        rootDir: './custom',
        framework: 'react',
      });

      const config = scanner.getConfig();
      expect(config.rootDir).toBe('./custom');
      expect(config.framework).toBe('react');
    });
  });

  describe('Scanner.scan', () => {
    test('should scan fixtures directory', async () => {
      const scanner = createScanner({
        rootDir: FIXTURES_DIR,
        include: ['**/*.tsx'],
        exclude: [],
      });

      const result = await scanner.scan();

      expect(result.components.length).toBeGreaterThan(0);
    });

    test('should find components in fixtures', async () => {
      const scanner = createScanner({
        rootDir: FIXTURES_DIR,
        include: ['**/*.tsx'],
        exclude: [],
      });

      const result = await scanner.scan();

      const componentNames = result.components.map(c => c.name);
      expect(componentNames).toContain('SimpleButton');
      expect(componentNames).toContain('LoginForm');
      expect(componentNames).toContain('NoTestIds');
    });

    test('should detect interactive elements', async () => {
      const scanner = createScanner({
        rootDir: FIXTURES_DIR,
        include: ['**/*.tsx'],
        exclude: [],
      });

      const result = await scanner.scan();

      const loginForm = result.components.find(c => c.name === 'LoginForm');
      expect(loginForm).toBeDefined();
      expect(loginForm!.elements.length).toBeGreaterThan(0);
    });

    test('should calculate coverage', async () => {
      const scanner = createScanner({
        rootDir: FIXTURES_DIR,
        include: ['**/*.tsx'],
        exclude: [],
      });

      const result = await scanner.scan();

      expect(result.coverage.totalComponents).toBeGreaterThan(0);
      expect(result.coverage.totalElements).toBeGreaterThan(0);
    });

    test('should exclude specified patterns', async () => {
      const scanner = createScanner({
        rootDir: FIXTURES_DIR,
        include: ['**/*.tsx', '**/*.ts'],
        exclude: ['**/NotAComponent.ts'],
      });

      const result = await scanner.scan();

      // Should not include the utility file as a component
      // (it might be scanned but should return null from analyzer)
      const componentNames = result.components.map(c => c.name);
      expect(componentNames).not.toContain('NotAComponent');
    });

    test('should handle empty directory gracefully', async () => {
      const scanner = createScanner({
        rootDir: '/tmp/nonexistent-scanner-test-dir',
        include: ['**/*.tsx'],
        exclude: [],
      });

      const result = await scanner.scan();

      expect(result.components).toHaveLength(0);
      expect(result.coverage.totalComponents).toBe(0);
    });

    test('should set hasTests to false for fixtures', async () => {
      const scanner = createScanner({
        rootDir: FIXTURES_DIR,
        include: ['**/*.tsx'],
        exclude: [],
      });

      const result = await scanner.scan();

      // Fixtures don't have test files
      for (const component of result.components) {
        expect(component.hasTests).toBe(false);
      }
    });

    test('should return relative file paths', async () => {
      const scanner = createScanner({
        rootDir: FIXTURES_DIR,
        include: ['**/*.tsx'],
        exclude: [],
      });

      const result = await scanner.scan();

      for (const component of result.components) {
        // Should not start with absolute path
        expect(component.filePath).not.toMatch(/^\//);
        expect(component.filePath).toMatch(/\.tsx$/);
      }
    });
  });

  describe('Scanner.getConfig', () => {
    test('should return merged config', () => {
      const scanner = createScanner({
        rootDir: './src',
        outDir: './tests',
        framework: 'react',
        baseUrl: 'http://localhost:8080',
      });

      const config = scanner.getConfig();

      expect(config.rootDir).toBe('./src');
      expect(config.outDir).toBe('./tests');
      expect(config.framework).toBe('react');
      expect(config.baseUrl).toBe('http://localhost:8080');
    });

    test('should have default values for unspecified options', () => {
      const scanner = createScanner({
        rootDir: './src',
      });

      const config = scanner.getConfig();

      expect(config.include).toBeDefined();
      expect(config.include.length).toBeGreaterThan(0);
      expect(config.exclude).toBeDefined();
      expect(config.suggestTestIds).toBe(true);
    });
  });
});
