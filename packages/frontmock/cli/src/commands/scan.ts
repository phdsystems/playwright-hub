/**
 * Scan Command
 *
 * Analyze codebase for components and test coverage
 */

import chalk from 'chalk'
import ora from 'ora'

export interface ScanOptions {
  format?: 'console' | 'json' | 'markdown'
  output?: string
  framework?: 'react' | 'vue' | 'angular' | 'auto'
  include?: string[]
  exclude?: string[]
}

export async function scanCommand(path: string, options: ScanOptions) {
  const spinner = ora('Scanning codebase...').start()

  try {
    // Import scanner dynamically
    const { scanDirectory, formatOutput } = await import('@ux.qa/scanner')

    const results = await scanDirectory(path, {
      include: options.include || ['**/*.{ts,tsx,js,jsx}'],
      exclude: options.exclude || ['**/*.{test,spec}.{ts,tsx,js,jsx}', '**/node_modules/**'],
      framework: options.framework || 'auto',
    })

    spinner.succeed('Scan complete!')

    // Format output
    const format = options.format || 'console'
    const output = formatOutput(results, format)

    // Write to file or console
    if (options.output) {
      const fs = await import('fs/promises')
      await fs.writeFile(options.output, output, 'utf-8')
      console.log(chalk.green(`\n✓ Report written to ${options.output}`))
    } else {
      console.log('\n' + output)
    }

    // Summary
    console.log(chalk.bold('\nSummary:'))
    console.log(`  Components: ${results.coverage.totalComponents}`)
    console.log(`  With tests: ${results.coverage.testedComponents} (${Math.round((results.coverage.testedComponents / results.coverage.totalComponents) * 100)}%)`)
    console.log(`  Elements: ${results.coverage.totalElements}`)
    console.log(`  With test-id: ${results.coverage.elementsWithTestId} (${Math.round((results.coverage.elementsWithTestId / results.coverage.totalElements) * 100)}%)`)

  } catch (error) {
    spinner.fail('Scan failed')
    console.error(chalk.red((error as Error).message))
    process.exit(1)
  }
}
