// Main entry point for @ux.qa/scanner

export { Scanner, createScanner, scanDirectory } from './scanner';
export { analyzeReactFile } from './analyzer/react';
export {
  generateTestFile,
  generateE2ETest,
  generateComponentTest,
  generateIntegrationTest,
  type TestType,
} from './generator';
export { calculateCoverage, printCoverageReport, generateJsonReport } from './reporter/coverage';
export { formatOutput } from './formatter';

export type {
  ScannerConfig,
  ComponentInfo,
  ElementInfo,
  ElementType,
  PropInfo,
  ScanResult,
  RouteInfo,
  CoverageStats,
  GeneratedTest,
  TestGeneratorOptions,
} from './types';
