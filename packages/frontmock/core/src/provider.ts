/**
 * Main Test Provider Entry Point
 *
 * Automatically detects and uses the appropriate test runner.
 * Falls back to Vitest if available, otherwise requires explicit provider.
 */

import type { TestingProvider, ProviderFactory, ProviderRegistry } from './types'

// ============================================================================
// Provider Registry
// ============================================================================

const providers = new Map<string, ProviderFactory>()

/**
 * Register a custom provider factory
 */
export function registerProvider(name: string, factory: ProviderFactory): void {
  providers.set(name, factory)
}

/**
 * Get a provider by name (async)
 */
export async function getProvider(name: string): Promise<TestingProvider> {
  const factory = providers.get(name)
  if (factory) {
    return factory()
  }

  // Load built-in providers dynamically
  switch (name) {
    case 'vitest': {
      const { createVitestProvider } = await import('./providers/vitest')
      return createVitestProvider()
    }
    case 'bun': {
      const { createBunProvider } = await import('./providers/bun')
      return createBunProvider()
    }
    case 'jest': {
      const { createJestProvider } = await import('./providers/jest')
      return createJestProvider()
    }
    default:
      throw new Error(`Unknown test provider: ${name}`)
  }
}

export const registry: ProviderRegistry = {
  register: registerProvider,
  get: getProvider,
  getSync: () => {
    throw new Error('Use getProvider() for async provider loading')
  },
  setDefault: () => {}, // No-op for now
}

// ============================================================================
// Auto-detect and load default provider
// ============================================================================

let defaultProvider: TestingProvider | null = null

/**
 * Auto-detect available test provider
 */
export async function detectProvider(): Promise<TestingProvider> {
  if (defaultProvider) {
    return defaultProvider
  }

  // Try Vitest first (most common)
  try {
    const { createVitestProvider } = await import('./providers/vitest')
    defaultProvider = await createVitestProvider()
    return defaultProvider
  } catch (e) {
    // Vitest not available
  }

  // Try Bun
  try {
    const { createBunProvider } = await import('./providers/bun')
    defaultProvider = await createBunProvider()
    return defaultProvider
  } catch (e) {
    // Bun not available
  }

  // Try Jest
  try {
    const { createJestProvider } = await import('./providers/jest')
    defaultProvider = await createJestProvider()
    return defaultProvider
  } catch (e) {
    // Jest not available
  }

  throw new Error(
    'No test provider detected. Install vitest, bun, or jest to use @ux.qa/frontmock'
  )
}

// ============================================================================
// Static Provider Export (for Vitest/Bun environments)
// ============================================================================

/**
 * The main testing provider instance
 *
 * IMPORTANT: This requires Vitest to be installed and available.
 * For other test runners, use getProvider() or detectProvider().
 */
let t: TestingProvider

// Try to load Vitest statically for better DX
try {
  const {
    describe,
    it,
    test,
    expect,
    vi,
    beforeAll,
    afterAll,
    beforeEach,
    afterEach,
  } = await import('vitest')

  const { render, screen, cleanup, waitFor, act } = await import('@testing-library/react')
  const userEventModule = await import('@testing-library/user-event')
  const userEvent = userEventModule.default

  t = {
    name: 'vitest' as const,
    version: '4.x',
    describe,
    it,
    test,
    beforeAll,
    afterAll,
    beforeEach,
    afterEach,
    expect,
    vi: {
      fn: vi.fn,
      spyOn: vi.spyOn,
      stubGlobal: vi.stubGlobal,
      unstubAllGlobals: vi.unstubAllGlobals,
      clearAllMocks: vi.clearAllMocks,
      resetAllMocks: vi.resetAllMocks,
      restoreAllMocks: vi.restoreAllMocks,
    },
    mock: {
      fn: vi.fn,
      spyOn: vi.spyOn,
      stubGlobal: vi.stubGlobal,
      unstubAllGlobals: vi.unstubAllGlobals,
      clearAllMocks: vi.clearAllMocks,
      resetAllMocks: vi.resetAllMocks,
      restoreAllMocks: vi.restoreAllMocks,
    },
    render,
    screen,
    userEvent,
    cleanup,
    waitFor,
    act,
    skip: () => {
      throw new Error('Use it.skip or describe.skip instead')
    },
    only: () => {
      throw new Error('Use it.only or describe.only instead')
    },
  } as any
} catch (e) {
  // Vitest not available, will need to use getProvider()
  console.warn(
    '@ux.qa/frontmock: Vitest not detected. Use getProvider() to load a test provider.'
  )
}

/**
 * Alternative named export
 */
export const testing = t

export { t }
