/**
 * Generate Command
 *
 * Generate test files from component analysis
 */

import chalk from 'chalk'
import ora from 'ora'
import { mkdir, writeFile } from 'fs/promises'
import { dirname } from 'path'

export interface GenerateOptions {
  template?: 'playwright' | 'vitest' | 'jest'
  type?: 'e2e' | 'component' | 'integration' | 'all'
  output?: string
  framework?: 'react' | 'vue' | 'angular'
  dryRun?: boolean
  force?: boolean
}

export async function generateCommand(path: string, options: GenerateOptions) {
  const spinner = ora('Analyzing components...').start()

  try {
    // Import scanner
    const { scanDirectory } = await import('@ux.qa/scanner')

    const results = await scanDirectory(path, {
      framework: options.framework || 'react',
    })

    const testType = options.type || 'component' // Default to component tests
    spinner.text = `Generating ${testType} test files...`

    const generated: string[] = []
    const skipped: string[] = []

    // Import test generator
    const { generateTestFile } = await import('@ux.qa/scanner')

    for (const component of results.components) {
      // Skip if already has tests and not forcing
      if (component.hasTests && !options.force) {
        skipped.push(component.name)
        continue
      }

      // Generate test(s) based on type
      const generatorOptions = {
        type: testType,
        includeVisibility: true,
        includeInteractions: true,
        includeNavigation: testType === 'e2e',
        includeForms: true,
        includeA11y: false,
        addTodos: true,
      }

      const tests = generateTestFile(component, generatorOptions)
      const testArray = Array.isArray(tests) ? tests : [tests]

      for (const test of testArray) {
        if (options.dryRun) {
          // Dry run: just show what would be generated
          console.log(chalk.gray(`Would generate: ${test.filePath}`))
          console.log(chalk.dim(`  ${test.testCount} tests for ${component.name}`))
        } else {
          // Actually generate the test file
          const outputDir = options.output || dirname(test.filePath)
          const outputPath = options.output
            ? `${outputDir}/${test.filePath.split('/').pop()}`
            : test.filePath

          // Ensure directory exists
          await mkdir(dirname(outputPath), { recursive: true })

          // Write test file
          await writeFile(outputPath, test.content, 'utf-8')

          console.log(chalk.green(`✓ Generated ${outputPath}`))
          console.log(chalk.dim(`  ${test.testCount} tests for ${component.name}`))
        }
      }

      generated.push(component.name)
    }

    spinner.succeed('Generation complete!')

    console.log(chalk.bold('\nResults:'))
    console.log(chalk.green(`  Generated: ${generated.length} test files`))
    if (skipped.length > 0) {
      console.log(chalk.yellow(`  Skipped: ${skipped.length} (already have tests)`))
    }

    if (generated.length > 0 && !options.dryRun) {
      console.log(chalk.dim('\n💡 Tip: Review and customize the generated tests before committing'))
    }

  } catch (error) {
    spinner.fail('Generation failed')
    console.error(chalk.red((error as Error).message))
    process.exit(1)
  }
}
