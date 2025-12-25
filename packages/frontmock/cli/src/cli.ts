#!/usr/bin/env node

/**
 * UX.QA Test Framework CLI
 *
 * Unified command-line interface for testing operations
 */

import { Command } from 'commander'
import { scanCommand } from './commands/scan'
import { generateCommand } from './commands/generate'
import { runCommand } from './commands/run'
import { reportCommand } from './commands/report'
import { initCommand } from './commands/init'

const program = new Command()

program
  .name('uxqa')
  .description('UX.QA Test Framework - Comprehensive testing toolkit for TypeScript applications')
  .version('0.1.0')

// Scan command - analyze codebase
program
  .command('scan')
  .description('Scan codebase for components and test coverage')
  .argument('[path]', 'Path to scan', '.')
  .option('-f, --format <format>', 'Output format (console|json|markdown)', 'console')
  .option('-o, --output <file>', 'Output file path')
  .option('--framework <framework>', 'Framework to analyze (react|vue|angular|auto)', 'auto')
  .option('--include <patterns...>', 'File patterns to include')
  .option('--exclude <patterns...>', 'File patterns to exclude')
  .action(scanCommand)

// Generate command - generate test scaffolds
program
  .command('generate')
  .description('Generate test files from component analysis')
  .argument('[path]', 'Path to analyze', '.')
  .option('--type <type>', 'Test type (e2e|component|integration|all)', 'component')
  .option('-t, --template <template>', 'Test template (playwright|vitest|jest)', 'playwright')
  .option('-o, --output <dir>', 'Output directory for generated tests', './tests')
  .option('--framework <framework>', 'Framework to analyze (react|vue|angular)', 'react')
  .option('--dry-run', 'Show what would be generated without writing files')
  .option('--force', 'Overwrite existing test files')
  .action(generateCommand)

// Run command - execute tests
program
  .command('run')
  .description('Run tests with the configured provider')
  .option('-p, --provider <provider>', 'Test provider (vitest|jest|playwright|bun)')
  .option('-w, --watch', 'Watch mode')
  .option('--coverage', 'Collect coverage')
  .option('--ui', 'Open test UI')
  .action(runCommand)

// Report command - generate test reports
program
  .command('report')
  .description('Generate test coverage and analysis reports')
  .option('-f, --format <format>', 'Report format (html|json|markdown)', 'html')
  .option('-o, --output <dir>', 'Output directory', './reports')
  .option('--open', 'Open report in browser')
  .action(reportCommand)

// Init command - initialize test framework
program
  .command('init')
  .description('Initialize UX.QA test framework in your project')
  .option('--provider <provider>', 'Default test provider (vitest|jest|playwright)')
  .option('--framework <framework>', 'Project framework (react|vue|angular|node)')
  .option('--skip-install', 'Skip package installation')
  .action(initCommand)

program.parse()
