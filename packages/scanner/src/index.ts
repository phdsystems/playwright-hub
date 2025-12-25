// Main entry point for @ux.qa/scanner

export { Scanner, createScanner } from './scanner';
export { analyzeReactFile } from './analyzer/react';
export { generateTestFile } from './generator/test-template';
export { calculateCoverage, printCoverageReport, generateJsonReport } from './reporter/coverage';

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
