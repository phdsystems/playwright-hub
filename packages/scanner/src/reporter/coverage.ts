import type { ComponentInfo, CoverageStats, ScanResult } from '../types';
import chalk from 'chalk';

export function calculateCoverage(components: ComponentInfo[]): CoverageStats {
  const totalElements = components.reduce((sum, c) => sum + c.elements.length, 0);
  const elementsWithTestId = components.reduce(
    (sum, c) => sum + c.elements.filter(e => e.testId).length,
    0
  );

  const allRoutes = new Set<string>();
  const testedRoutes = new Set<string>();

  components.forEach((c) => {
    c.routes.forEach((r) => {
      allRoutes.add(r);
      if (c.hasTests) testedRoutes.add(r);
    });
  });

  return {
    totalComponents: components.length,
    testedComponents: components.filter(c => c.hasTests).length,
    totalElements,
    elementsWithTestId,
    totalRoutes: allRoutes.size,
    testedRoutes: testedRoutes.size,
  };
}

export function printCoverageReport(result: ScanResult): void {
  const { coverage, components, warnings } = result;

  console.log('\n' + chalk.bold.blue('═══════════════════════════════════════════════════════'));
  console.log(chalk.bold.blue('  📊 Playwright Scanner - Coverage Report'));
  console.log(chalk.bold.blue('═══════════════════════════════════════════════════════\n'));

  // Overall summary
  const componentCoverage = coverage.totalComponents > 0
    ? Math.round((coverage.testedComponents / coverage.totalComponents) * 100)
    : 0;
  const testIdCoverage = coverage.totalElements > 0
    ? Math.round((coverage.elementsWithTestId / coverage.totalElements) * 100)
    : 0;
  const routeCoverage = coverage.totalRoutes > 0
    ? Math.round((coverage.testedRoutes / coverage.totalRoutes) * 100)
    : 0;

  console.log(chalk.bold('Summary:'));
  console.log(formatCoverageLine('Components with tests', coverage.testedComponents, coverage.totalComponents, componentCoverage));
  console.log(formatCoverageLine('Elements with data-testid', coverage.elementsWithTestId, coverage.totalElements, testIdCoverage));
  console.log(formatCoverageLine('Routes with tests', coverage.testedRoutes, coverage.totalRoutes, routeCoverage));

  // Components without tests
  const untestedComponents = components.filter(c => !c.hasTests);
  if (untestedComponents.length > 0) {
    console.log('\n' + chalk.bold.yellow('⚠ Components without tests:'));
    untestedComponents.slice(0, 10).forEach((c) => {
      const elementCount = c.elements.length;
      console.log(`  ${chalk.yellow('•')} ${c.name} (${c.filePath}) - ${elementCount} interactive elements`);
    });
    if (untestedComponents.length > 10) {
      console.log(chalk.gray(`  ... and ${untestedComponents.length - 10} more`));
    }
  }

  // Elements missing data-testid
  const elementsNeedingTestId = components
    .flatMap(c => c.elements.filter(e => !e.testId).map(e => ({ ...e, component: c.name, file: c.filePath })))
    .slice(0, 15);

  if (elementsNeedingTestId.length > 0) {
    console.log('\n' + chalk.bold.cyan('💡 Suggested data-testid additions:'));
    elementsNeedingTestId.forEach((e) => {
      console.log(`  ${chalk.cyan('+')} ${e.file}:${e.line}`);
      console.log(`    ${chalk.gray(`Add`)} data-testid="${e.suggestedTestId}" ${chalk.gray(`to <${e.type}>${e.label ? ` "${e.label}"` : ''}`)}`);
    });

    const totalMissing = components.reduce(
      (sum, c) => sum + c.elements.filter(e => !e.testId).length,
      0
    );
    if (totalMissing > 15) {
      console.log(chalk.gray(`  ... and ${totalMissing - 15} more elements`));
    }
  }

  // Warnings
  if (warnings.length > 0) {
    console.log('\n' + chalk.bold.red('⚠ Warnings:'));
    warnings.forEach(w => console.log(`  ${chalk.red('!')} ${w}`));
  }

  // Footer
  console.log('\n' + chalk.bold.blue('═══════════════════════════════════════════════════════'));

  // Recommendations
  console.log('\n' + chalk.bold('Recommendations:'));
  if (componentCoverage < 80) {
    console.log(`  ${chalk.yellow('•')} Add tests for untested components to reach 80% coverage`);
  }
  if (testIdCoverage < 90) {
    console.log(`  ${chalk.yellow('•')} Add data-testid to interactive elements for stable selectors`);
  }
  if (componentCoverage >= 80 && testIdCoverage >= 90) {
    console.log(`  ${chalk.green('✓')} Good coverage! Keep up the great work.`);
  }

  console.log('\n' + chalk.gray('Run `pw-scanner generate` to create test scaffolds.'));
  console.log('');
}

function formatCoverageLine(
  label: string,
  current: number,
  total: number,
  percentage: number
): string {
  const bar = createProgressBar(percentage, 20);
  const color = percentage >= 80 ? chalk.green : percentage >= 50 ? chalk.yellow : chalk.red;
  return `  ${label.padEnd(30)} ${bar} ${color(`${percentage}%`)} (${current}/${total})`;
}

function createProgressBar(percentage: number, width: number): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  const color = percentage >= 80 ? chalk.green : percentage >= 50 ? chalk.yellow : chalk.red;
  return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

export function generateJsonReport(result: ScanResult): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    coverage: result.coverage,
    components: result.components.map(c => ({
      name: c.name,
      filePath: c.filePath,
      hasTests: c.hasTests,
      testFilePath: c.testFilePath,
      elementCount: c.elements.length,
      elementsWithTestId: c.elements.filter(e => e.testId).length,
      routes: c.routes,
    })),
    suggestions: result.components
      .flatMap(c => c.elements.filter(e => !e.testId).map(e => ({
        file: c.filePath,
        line: e.line,
        element: e.type,
        suggestedTestId: e.suggestedTestId,
      }))),
    warnings: result.warnings,
  }, null, 2);
}
