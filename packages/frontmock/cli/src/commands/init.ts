/**
 * Init Command
 *
 * Initialize UX.QA test framework in your project
 */

import chalk from 'chalk'
import ora from 'ora'
import { spawn } from 'child_process'

export interface InitOptions {
  provider?: 'vitest' | 'jest' | 'playwright'
  framework?: 'react' | 'vue' | 'angular' | 'node'
  skipInstall?: boolean
}

export async function initCommand(options: InitOptions) {
  console.log(chalk.bold.blue('🚀 Initializing UX.QA Test Framework\n'))

  const provider = options.provider || await promptProvider()
  const framework = options.framework || await promptFramework()

  const spinner = ora('Creating configuration files...').start()

  try {
    const fs = await import('fs/promises')

    // Create uxqa.config.ts
    const config = generateConfig(provider, framework)
    await fs.writeFile('uxqa.config.ts', config, 'utf-8')

    spinner.succeed('Configuration created!')

    // Install dependencies
    if (!options.skipInstall) {
      spinner.start('Installing dependencies...')
      await installDependencies(provider, framework)
      spinner.succeed('Dependencies installed!')
    }

    console.log(chalk.green('\n✓ UX.QA Test Framework initialized!\n'))
    console.log(chalk.bold('Next steps:'))
    console.log('  1. Run', chalk.cyan('uxqa scan'), 'to analyze your codebase')
    console.log('  2. Run', chalk.cyan('uxqa generate'), 'to create test scaffolds')
    console.log('  3. Run', chalk.cyan('uxqa run'), 'to execute tests\n')

  } catch (error) {
    spinner.fail('Initialization failed')
    console.error(chalk.red((error as Error).message))
    process.exit(1)
  }
}

function generateConfig(provider: string, framework: string): string {
  return `import { defineConfig } from '@ux.qa/frontmock'

export default defineConfig({
  // Test provider
  testRunner: '${provider}',

  // Project framework
  framework: '${framework}',

  // Scanner configuration
  scanner: {
    include: ['**/*.{ts,tsx,js,jsx}'],
    exclude: ['**/*.{test,spec}.{ts,tsx,js,jsx}', '**/node_modules/**'],
  },

  // Generator configuration
  generator: {
    outputDir: './tests',
    template: '${provider}',
    addTodos: true,
  },

  // Reporter configuration (optional)
  reporter: {
    hubUrl: process.env.UXQA_HUB_URL,
    appId: '${process.cwd().split('/').pop()}',
  },
})
`
}

async function installDependencies(provider: string, framework: string): Promise<void> {
  const packages: string[] = ['@ux.qa/frontmock', '@ux.qa/test-cli']

  switch (provider) {
    case 'vitest':
      packages.push('vitest', '@vitejs/plugin-react')
      break
    case 'jest':
      packages.push('jest', '@types/jest')
      break
    case 'playwright':
      packages.push('@playwright/test')
      break
  }

  if (framework === 'react') {
    packages.push('@testing-library/react', '@testing-library/user-event', '@testing-library/jest-dom')
  }

  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['install', '--save-dev', ...packages], {
      stdio: 'inherit',
      shell: true,
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`npm install failed with code ${code}`))
      }
    })
  })
}

async function promptProvider(): Promise<string> {
  // TODO: Implement interactive prompt
  return 'vitest'
}

async function promptFramework(): Promise<string> {
  // TODO: Implement interactive prompt
  return 'react'
}
