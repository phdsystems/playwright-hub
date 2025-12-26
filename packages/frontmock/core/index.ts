/**
 * L3 Core - Implementation Layer
 *
 * Contains all implementations:
 * - Test components (mocks, wrappers, providers)
 * - Framework adapters (Vitest, Jest, Bun)
 * - Utilities (assertions, fixtures, mocks, wait)
 */

// Legacy types (for backwards compatibility)
export * from './types'

// Components - Test components
export * from './components'

// Providers - Framework adapters
export * from './providers/vitest'
export * from './providers/bun'

// Utilities - Helper functions
export * from './utilities'

// Main provider instance
export { t, testing } from './provider'
