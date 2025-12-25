#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import chalk from 'chalk';
import { createScanner } from './scanner';
import { printCoverageReport, generateJsonReport } from './reporter/coverage';
import { generateTestFile } from './generator/test-template';
import type { ScannerConfig, TestGeneratorOptions } from './types';

const VERSION = '0.1.0';

interface CliArgs {
  command: 'scan' | 'generate' | 'init' | 'help' | 'version';
  rootDir: string;
  outDir: string;
  framework: 'react' | 'vue' | 'html' | 'auto';
  json: boolean;
  write: boolean;
  include: string[];
  exclude: string[];
  baseUrl: string;
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    command: 'scan',
    rootDir: './src',
    outDir: './tests/e2e',
    framework: 'auto',
    json: false,
    write: false,
    include: ['**/*.tsx', '**/*.jsx'],
    exclude: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*'],
    baseUrl: 'http://localhost:5173',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === 'scan' || arg === 'generate' || arg === 'init' || arg === 'help' || arg === 'version') {
      result.command = arg;
    } else if (arg === '--root' || arg === '-r') {
      result.rootDir = args[++i];
    } else if (arg === '--out' || arg === '-o') {
      result.outDir = args[++i];
    } else if (arg === '--framework' || arg === '-f') {
      result.framework = args[++i] as CliArgs['framework'];
    } else if (arg === '--json') {
      result.json = true;
    } else if (arg === '--write' || arg === '-w') {
      result.write = true;
    } else if (arg === '--include' || arg === '-i') {
      result.include = args[++i].split(',');
    } else if (arg === '--exclude' || arg === '-e') {
      result.exclude = args[++i].split(',');
    } else if (arg === '--base-url' || arg === '-b') {
      result.baseUrl = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      result.command = 'help';
    } else if (arg === '--version' || arg === '-v') {
      result.command = 'version';
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
${chalk.bold.blue('@ux.qa/scanner')} v${VERSION}

${chalk.bold('Usage:')}
  uxqa-scanner <command> [options]

${chalk.bold('Commands:')}
  scan      Analyze project and show coverage report (default)
  generate  Generate test scaffolds for untested components
  init      Create configuration file
  help      Show this help message
  version   Show version

${chalk.bold('Options:')}
  -r, --root <dir>       Root directory to scan (default: ./src)
  -o, --out <dir>        Output directory for tests (default: ./tests/e2e)
  -f, --framework <fw>   Framework: react, vue, html, auto (default: auto)
  -b, --base-url <url>   Base URL for tests (default: http://localhost:5173)
  -i, --include <glob>   Include patterns (comma-separated)
  -e, --exclude <glob>   Exclude patterns (comma-separated)
  -w, --write            Write generated tests to files
  --json                 Output JSON report

${chalk.bold('Examples:')}
  ${chalk.gray('# Scan React project')}
  uxqa-scanner scan --root ./src

  ${chalk.gray('# Generate tests and write to files')}
  uxqa-scanner generate --write

  ${chalk.gray('# Scan with custom patterns')}
  uxqa-scanner scan -i "components/**/*.tsx,pages/**/*.tsx"

  ${chalk.gray('# Output JSON report')}
  uxqa-scanner scan --json > coverage.json

${chalk.bold('Project Usage:')}
  ${chalk.gray('# Install in your project')}
  npm install -D @ux.qa/scanner

  ${chalk.gray('# Add to package.json scripts')}
  "scripts": {
    "test:coverage": "uxqa-scanner scan",
    "test:generate": "uxqa-scanner generate --write"
  }
`);
}

function printVersion(): void {
  console.log(`@ux.qa/scanner v${VERSION}`);
}

async function runScan(config: Partial<ScannerConfig>, json: boolean): Promise<void> {
  const scanner = createScanner(config);
  const result = await scanner.scan();

  if (json) {
    console.log(generateJsonReport(result));
  } else {
    printCoverageReport(result);
  }
}

async function runGenerate(config: Partial<ScannerConfig>, write: boolean): Promise<void> {
  const scanner = createScanner(config);
  const result = await scanner.scan();

  const untestedComponents = result.components.filter(c => !c.hasTests);

  if (untestedComponents.length === 0) {
    console.log(chalk.green('✓ All components have tests!'));
    return;
  }

  console.log(chalk.bold(`\nGenerating tests for ${untestedComponents.length} components...\n`));

  const generatedTests = untestedComponents.map(component =>
    generateTestFile(component, {}, config.baseUrl || 'http://localhost:5173')
  );

  for (const test of generatedTests) {
    if (write) {
      const dir = dirname(test.filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(test.filePath, test.content);
      console.log(chalk.green(`  ✓ ${test.filePath}`));
    } else {
      console.log(chalk.blue(`\n${'─'.repeat(60)}`));
      console.log(chalk.bold(`📄 ${test.filePath}`));
      console.log(chalk.blue('─'.repeat(60)));
      console.log(test.content);
    }
  }

  if (!write) {
    console.log(chalk.yellow(`\n💡 Run with --write to save files to disk.`));
  } else {
    console.log(chalk.green(`\n✓ Generated ${generatedTests.length} test files.`));
  }
}

function runInit(): void {
  const configPath = './uxqa-scanner.config.json';

  if (existsSync(configPath)) {
    console.log(chalk.yellow(`Config file already exists: ${configPath}`));
    return;
  }

  const config = {
    rootDir: './src',
    outDir: './tests/e2e',
    framework: 'auto',
    include: ['**/*.tsx', '**/*.jsx'],
    exclude: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*', '**/__tests__/**'],
    baseUrl: 'http://localhost:5173',
    suggestTestIds: true,
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(chalk.green(`✓ Created ${configPath}`));
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Load config file if exists
  let fileConfig: Partial<ScannerConfig> = {};
  const configPath = './uxqa-scanner.config.json';
  if (existsSync(configPath)) {
    try {
      fileConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
    } catch (e) {
      console.warn(chalk.yellow('Warning: Failed to parse config file'));
    }
  }

  // Merge configs (CLI args override file config)
  const config: Partial<ScannerConfig> = {
    ...fileConfig,
    rootDir: args.rootDir,
    outDir: args.outDir,
    framework: args.framework,
    include: args.include,
    exclude: args.exclude,
    baseUrl: args.baseUrl,
  };

  switch (args.command) {
    case 'help':
      printHelp();
      break;
    case 'version':
      printVersion();
      break;
    case 'init':
      runInit();
      break;
    case 'generate':
      await runGenerate(config, args.write);
      break;
    case 'scan':
    default:
      await runScan(config, args.json);
      break;
  }
}

main().catch((error) => {
  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
});
