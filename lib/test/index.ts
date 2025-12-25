/**
 * Test Provider SPI - Service Provider Interface for testing frameworks
 *
 * Central entry point for the testing SPI.
 * Provides a unified API that works with both Vitest and Bun test runners.
 *
 * Usage in tests:
 * ```typescript
 * import { t } from '@/lib/testing'
 *
 * const { describe, it, expect, render, screen } = t
 *
 * describe('MyComponent', () => {
 *   it('renders correctly', () => {
 *     render(<MyComponent />)
 *     expect(screen.getByText('Hello')).toBeInTheDocument()
 *   })
 * })
 * ```
 */

// Re-export types
export * from './types'

// ============================================================================
// Static Imports (Vitest - Primary Provider)
// ============================================================================

import {
  describe,
  it,
  test,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'vitest'

import { render, screen, cleanup, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { TestingProvider, ProviderFactory, ProviderRegistry } from './types'

// ============================================================================
// Provider Registry (for custom providers)
// ============================================================================

const providers = new Map<string, ProviderFactory>()

/**
 * Register a custom provider factory
 */
export function registerProvider(name: string, factory: ProviderFactory): void {
  providers.set(name, factory)
}

/**
 * Get a custom provider by name (async)
 */
export async function getProvider(name: string): Promise<TestingProvider> {
  const factory = providers.get(name)
  if (factory) {
    return factory()
  }

  // Load built-in providers dynamically
  switch (name) {
    case 'vitest': {
      const { createVitestProvider } = await import('./provider/vitest')
      return createVitestProvider()
    }
    case 'bun': {
      const { createBunProvider } = await import('./provider/bun')
      return createBunProvider()
    }
    default:
      throw new Error(`Unknown test provider: ${name}`)
  }
}

export const registry: ProviderRegistry = {
  register: registerProvider,
  get: getProvider,
  getSync: () => t, // Return the default provider
  setDefault: () => {}, // No-op for now
}

// ============================================================================
// Main Provider Export (Vitest)
// ============================================================================

/**
 * The main testing provider instance
 *
 * This exports Vitest primitives directly, which works because:
 * 1. Vitest is the primary test runner for this project
 * 2. Static imports are required for Vitest's ESM module system
 * 3. For Bun tests, use `bun test` which uses bun:test natively
 *
 * Usage:
 * ```typescript
 * import { t } from '@/lib/testing'
 * const { describe, it, expect, vi, render, screen, userEvent } = t
 * ```
 */
export const t = {
  // Provider metadata
  name: 'vitest' as const,
  version: '4.x',

  // Test definition functions (pass through directly)
  describe,
  it,
  test,

  // Lifecycle hooks
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,

  // Assertions
  expect,

  // Mocking utilities
  vi: {
    fn: vi.fn,
    spyOn: vi.spyOn,
    mock: vi.mock,
    stubGlobal: vi.stubGlobal,
    unstubAllGlobals: vi.unstubAllGlobals,
    clearAllMocks: vi.clearAllMocks,
    resetAllMocks: vi.resetAllMocks,
    restoreAllMocks: vi.restoreAllMocks,
  },

  // Alias for vi (compatibility)
  mock: {
    fn: vi.fn,
    spyOn: vi.spyOn,
    stubGlobal: vi.stubGlobal,
    unstubAllGlobals: vi.unstubAllGlobals,
    clearAllMocks: vi.clearAllMocks,
    resetAllMocks: vi.resetAllMocks,
    restoreAllMocks: vi.restoreAllMocks,
  },

  // DOM Testing utilities
  render,
  screen,
  userEvent,
  cleanup,
  waitFor,
  act,

  // Utility functions
  skip: () => { throw new Error('Use it.skip or describe.skip instead') },
  only: () => { throw new Error('Use it.only or describe.only instead') },
}

/**
 * Alternative named export
 */
export const testing = t

// Default export
export default t
