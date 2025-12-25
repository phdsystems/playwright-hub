/**
 * Playwright Provider Implementation
 *
 * Adapts Playwright Test APIs to the TestingProvider SPI
 * Note: Playwright is primarily an E2E framework, so some features differ
 */

import type { TestingProvider, MockFunctions } from '../types'

let playwrightModule: typeof import('@playwright/test') | null = null

async function loadModules() {
  if (!playwrightModule) {
    playwrightModule = await import('@playwright/test')
  }
}

// Playwright doesn't have built-in mocking like Vitest/Jest
// This provides a minimal compatibility layer
function createMockFunctions(): MockFunctions {
  const mocks = new Map<string, any>()

  return {
    fn: ((implementation?: (...args: unknown[]) => unknown) => {
      const mockFn = implementation || (() => undefined)
      const calls: any[] = []

      const mock = (...args: any[]) => {
        calls.push(args)
        return mockFn(...args)
      }

      ;(mock as any).mock = {
        calls,
        results: [],
        instances: [],
        lastCall: calls[calls.length - 1],
      }

      ;(mock as any).mockClear = () => {
        calls.length = 0
        return mock
      }

      return mock as any
    }) as MockFunctions['fn'],

    spyOn: ((obj: object, method: string) => {
      const original = (obj as any)[method]
      const calls: any[] = []

      const spy = (...args: any[]) => {
        calls.push(args)
        return original(...args)
      }

      ;(spy as any).mock = {
        calls,
        results: [],
        instances: [],
        lastCall: calls[calls.length - 1],
      }
      ;(spy as any).mockRestore = () => {
        ;(obj as any)[method] = original
      }

      ;(obj as any)[method] = spy
      return spy as any
    }) as MockFunctions['spyOn'],

    stubGlobal: (name: string, value: unknown) => {
      mocks.set(name, (globalThis as any)[name])
      ;(globalThis as any)[name] = value
    },

    unstubAllGlobals: () => {
      mocks.forEach((value, key) => {
        ;(globalThis as any)[key] = value
      })
      mocks.clear()
    },

    clearAllMocks: () => {
      // No-op for Playwright
    },

    resetAllMocks: () => {
      // No-op for Playwright
    },

    restoreAllMocks: () => {
      // No-op for Playwright
    },
  }
}

export async function createPlaywrightProvider(): Promise<TestingProvider> {
  await loadModules()

  const { test, expect } = playwrightModule!

  const mockFunctions = createMockFunctions()

  // Playwright doesn't have component testing built-in by default
  // These are stub implementations that throw helpful errors
  const notSupported = (feature: string) => () => {
    throw new Error(
      `${feature} is not supported in Playwright provider. Use @playwright/experimental-ct-react for component testing.`
    )
  }

  return {
    // Provider metadata
    name: 'jest', // Playwright uses Jest-compatible API
    version: '1.x',

    // Test definition (Playwright uses 'test', not 'describe')
    describe: Object.assign(test.describe, {
      skip: test.describe.skip,
      only: test.describe.only,
      todo: notSupported('describe.todo') as any,
      each: notSupported('describe.each') as any,
    }),

    it: Object.assign(test, {
      skip: test.skip,
      only: test.only,
      todo: notSupported('it.todo') as any,
      each: notSupported('it.each') as any,
      concurrent: test,
    }),

    test: Object.assign(test, {
      skip: test.skip,
      only: test.only,
      todo: notSupported('test.todo') as any,
      each: notSupported('test.each') as any,
      concurrent: test,
    }),

    // Lifecycle hooks
    beforeAll: test.beforeAll,
    afterAll: test.afterAll,
    beforeEach: test.beforeEach,
    afterEach: test.afterEach,

    // Assertions (Playwright has its own expect)
    expect: expect as any,

    // Mocking
    vi: mockFunctions,
    mock: mockFunctions,

    // Utilities
    skip: () => {
      throw new Error('Use test.skip or test.describe.skip instead')
    },
    only: () => {
      throw new Error('Use test.only or test.describe.only instead')
    },

    // DOM Testing (not supported in standard Playwright)
    render: notSupported('render') as any,
    screen: notSupported('screen') as any,
    userEvent: {
      setup: notSupported('userEvent.setup') as any,
    },
    cleanup: notSupported('cleanup') as any,
    waitFor: notSupported('waitFor') as any,
    act: notSupported('act') as any,
  }
}

export default createPlaywrightProvider
