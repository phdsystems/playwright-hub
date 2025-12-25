/**
 * Run Command
 *
 * Execute tests with the configured provider
 */

import chalk from 'chalk'
import { spawn } from 'child_process'

export interface RunOptions {
  provider?: 'vitest' | 'jest' | 'playwright' | 'bun'
  watch?: boolean
  coverage?: boolean
  ui?: boolean
}

export async function runCommand(options: RunOptions) {
  const provider = options.provider || await detectProvider()

  console.log(chalk.blue(`Running tests with ${provider}...\n`))

  const args: string[] = []

  // Build command args based on provider
  switch (provider) {
    case 'vitest':
      if (options.watch) args.push('--watch')
      if (options.coverage) args.push('--coverage')
      if (options.ui) args.push('--ui')
      break

    case 'jest':
      if (options.watch) args.push('--watch')
      if (options.coverage) args.push('--coverage')
      break

    case 'playwright':
      args.push('test')
      if (options.ui) args.push('--ui')
      break

    case 'bun':
      args.push('test')
      if (options.watch) args.push('--watch')
      break
  }

  // Execute tests
  const child = spawn(provider, args, {
    stdio: 'inherit',
    shell: true,
  })

  child.on('exit', (code) => {
    process.exit(code || 0)
  })
}

async function detectProvider(): Promise<string> {
  try {
    const fs = await import('fs/promises')
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'))

    if (packageJson.devDependencies?.vitest || packageJson.dependencies?.vitest) {
      return 'vitest'
    }
    if (packageJson.devDependencies?.['@playwright/test']) {
      return 'playwright'
    }
    if (packageJson.devDependencies?.jest) {
      return 'jest'
    }
    if (packageJson.devDependencies?.['bun-types']) {
      return 'bun'
    }
  } catch (e) {
    // package.json not found
  }

  return 'vitest' // default
}
