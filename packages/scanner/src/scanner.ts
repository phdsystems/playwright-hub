import { glob } from 'glob';
import { existsSync, statSync } from 'fs';
import { join, relative, basename, dirname } from 'path';
import type {
  ScannerConfig,
  ScanResult,
  ComponentInfo,
  CoverageStats,
  RouteInfo,
} from './types';
import { analyzeReactFile } from './analyzer/react';
import { calculateCoverage } from './reporter/coverage';

const DEFAULT_CONFIG: ScannerConfig = {
  rootDir: '.',
  outDir: './tests/e2e',
  include: ['**/*.tsx', '**/*.jsx'],
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/__tests__/**',
    '**/*.stories.*',
  ],
  framework: 'auto',
  suggestTestIds: true,
  baseUrl: 'http://localhost:5173',
};

export class Scanner {
  private config: ScannerConfig;

  constructor(config: Partial<ScannerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async scan(): Promise<ScanResult> {
    const components: ComponentInfo[] = [];
    const warnings: string[] = [];

    // Find all component files
    const patterns = this.config.include.map(p => join(this.config.rootDir, p));
    const ignorePatterns = this.config.exclude;

    const files = await glob(patterns, {
      ignore: ignorePatterns,
      absolute: true,
    });

    console.log(`Found ${files.length} files to scan...`);

    // Analyze each file
    for (const file of files) {
      try {
        const framework = this.detectFramework(file);

        let component: ComponentInfo | null = null;

        if (framework === 'react') {
          component = analyzeReactFile(file);
        }
        // TODO: Add Vue and HTML analyzers

        if (component) {
          // Check for existing tests
          const testInfo = this.findExistingTest(file);
          component.hasTests = testInfo.hasTests;
          component.testFilePath = testInfo.testFilePath;
          component.filePath = relative(this.config.rootDir, file);

          components.push(component);
        }
      } catch (error) {
        warnings.push(`Failed to analyze ${file}: ${error}`);
      }
    }

    // Extract routes
    const routes = this.extractAllRoutes(components);

    // Calculate coverage
    const coverage = calculateCoverage(components);

    return {
      components,
      routes,
      coverage,
      warnings,
    };
  }

  private detectFramework(file: string): 'react' | 'vue' | 'html' {
    if (this.config.framework !== 'auto') {
      return this.config.framework as 'react' | 'vue' | 'html';
    }

    const ext = file.toLowerCase();
    if (ext.endsWith('.tsx') || ext.endsWith('.jsx')) {
      return 'react';
    }
    if (ext.endsWith('.vue')) {
      return 'vue';
    }
    return 'html';
  }

  private findExistingTest(componentFile: string): { hasTests: boolean; testFilePath?: string } {
    const componentName = basename(componentFile).replace(/\.(tsx|jsx|vue)$/, '');
    const componentDir = dirname(componentFile);

    // Common test file patterns
    const testPatterns = [
      // Same directory
      join(componentDir, `${componentName}.test.tsx`),
      join(componentDir, `${componentName}.test.ts`),
      join(componentDir, `${componentName}.spec.tsx`),
      join(componentDir, `${componentName}.spec.ts`),
      // __tests__ directory
      join(componentDir, '__tests__', `${componentName}.test.tsx`),
      join(componentDir, '__tests__', `${componentName}.test.ts`),
      // tests/e2e directory
      join(this.config.testDir || 'tests/e2e', `${this.toKebabCase(componentName)}.spec.ts`),
    ];

    for (const pattern of testPatterns) {
      if (existsSync(pattern)) {
        return { hasTests: true, testFilePath: pattern };
      }
    }

    return { hasTests: false };
  }

  private extractAllRoutes(components: ComponentInfo[]): RouteInfo[] {
    const routeMap = new Map<string, RouteInfo>();

    components.forEach((c) => {
      c.routes.forEach((path) => {
        if (!routeMap.has(path)) {
          routeMap.set(path, {
            path,
            component: c.name,
            hasTests: c.hasTests,
          });
        }
      });
    });

    return Array.from(routeMap.values());
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  getConfig(): ScannerConfig {
    return this.config;
  }
}

export function createScanner(config?: Partial<ScannerConfig>): Scanner {
  return new Scanner(config);
}

/**
 * Convenience function to scan a directory
 *
 * @param rootDir Directory to scan
 * @param config Scanner configuration
 * @returns Scan results
 */
export async function scanDirectory(
  rootDir: string,
  config?: Partial<Omit<ScannerConfig, 'rootDir'>>
): Promise<ScanResult> {
  const scanner = new Scanner({ ...config, rootDir });
  return scanner.scan();
}
