/**
 * Jest Provider Implementation
 *
 * Adapts Jest APIs to the TestingProvider SPI
 */

import type { TestingProvider, MockFunctions, MockInstance } from '../types'

let jestModule: typeof import('@jest/globals') | null = null
let rtlModule: typeof import('@testing-library/react') | null = null
let userEventModule: typeof import('@testing-library/user-event') | null = null

async function loadModules() {
  if (!jestModule) {
    jestModule = await import('@jest/globals')
  }
  if (!rtlModule) {
    rtlModule = await import('@testing-library/react')
  }
  if (!userEventModule) {
    userEventModule = await import('@testing-library/user-event')
  }
}

function createMockFunctions(jest: typeof import('@jest/globals')): MockFunctions {
  return {
    fn: ((implementation?: (...args: unknown[]) => unknown) => {
      return jest.fn(implementation) as unknown as MockInstance
    }) as MockFunctions['fn'],

    spyOn: ((obj: object, method: string) => {
      return jest.spyOn(obj as any, method as any) as unknown as MockInstance
    }) as MockFunctions['spyOn'],

    stubGlobal: (name: string, value: unknown) => {
      (globalThis as Record<string, unknown>)[name] = value
    },

    unstubAllGlobals: () => {
      // Jest doesn't have built-in stub tracking
      console.warn('unstubAllGlobals: Manual cleanup required in Jest')
    },

    clearAllMocks: () => {
      jest.clearAllMocks()
    },

    resetAllMocks: () => {
      jest.resetAllMocks()
    },

    restoreAllMocks: () => {
      jest.restoreAllMocks()
    },
  }
}

export async function createJestProvider(): Promise<TestingProvider> {
  await loadModules()

  const {
    describe,
    it,
    test,
    beforeAll,
    afterAll,
    beforeEach,
    afterEach,
    expect,
    jest,
  } = jestModule!

  const { render, screen, cleanup, waitFor, act } = rtlModule!
  const userEvent = userEventModule!.default

  const mockFunctions = createMockFunctions(jestModule!)

  return {
    // Provider metadata
    name: 'jest',
    version: '29.x',

    // Test definition
    describe: Object.assign(describe, {
      skip: describe.skip,
      only: describe.only,
      todo: describe.todo,
      each: describe.each,
    }),

    it: Object.assign(it, {
      skip: it.skip,
      only: it.only,
      todo: it.todo,
      each: it.each,
      concurrent: it.concurrent,
    }),

    test: Object.assign(test, {
      skip: test.skip,
      only: test.only,
      todo: test.todo,
      each: test.each,
      concurrent: test.concurrent,
    }),

    // Lifecycle hooks
    beforeAll,
    afterAll,
    beforeEach,
    afterEach,

    // Assertions
    expect: expect as TestingProvider['expect'],

    // Mocking
    vi: mockFunctions,
    mock: mockFunctions,

    // Utilities
    skip: () => {
      throw new Error('Use it.skip or describe.skip instead')
    },
    only: () => {
      throw new Error('Use it.only or describe.only instead')
    },

    // DOM Testing
    render,
    screen: screen as TestingProvider['screen'],
    userEvent: {
      setup: () => userEvent.setup() as ReturnType<TestingProvider['userEvent']['setup']>,
    },
    cleanup,
    waitFor,
    act: act as TestingProvider['act'],
  }
}

export default createJestProvider
