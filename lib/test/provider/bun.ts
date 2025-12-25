/**
 * Bun Provider Implementation
 *
 * Adapts Bun's built-in test APIs to the TestingProvider SPI
 * Uses happy-dom for DOM simulation
 */

import type { TestingProvider, MockFunctions, MockInstance } from '../types'

let bunTestModule: typeof import('bun:test') | null = null
let rtlModule: typeof import('@testing-library/react') | null = null
let userEventModule: typeof import('@testing-library/user-event') | null = null

async function loadModules() {
  if (!bunTestModule) {
    bunTestModule = await import('bun:test')
  }
  if (!rtlModule) {
    rtlModule = await import('@testing-library/react')
  }
  if (!userEventModule) {
    userEventModule = await import('@testing-library/user-event')
  }
}

// Bun mock wrapper to match our interface
function createMockFunctions(bunTest: typeof import('bun:test')): MockFunctions {
  const { mock, spyOn } = bunTest

  return {
    fn: ((implementation?: (...args: unknown[]) => unknown) => {
      const mockFn = mock(implementation ?? (() => undefined))
      return mockFn as unknown as MockInstance
    }) as MockFunctions['fn'],

    spyOn: ((obj: object, method: string) => {
      return spyOn(obj, method as keyof typeof obj) as unknown as MockInstance
    }) as MockFunctions['spyOn'],

    stubGlobal: (name: string, value: unknown) => {
      (globalThis as Record<string, unknown>)[name] = value
    },

    unstubAllGlobals: () => {
      // Bun doesn't have built-in stub tracking, would need manual implementation
      console.warn('unstubAllGlobals: Manual cleanup required in Bun')
    },

    clearAllMocks: () => {
      // Bun handles this differently
    },

    resetAllMocks: () => {
      // Bun handles this differently
    },

    restoreAllMocks: () => {
      // Bun handles this differently
    },
  }
}

// Wrapper to add missing methods to Bun's describe/it
function wrapSuite(
  fn: (name: string, fn: () => void) => void,
  skip: (name: string, fn: () => void) => void,
  only: (name: string, fn: () => void) => void,
  todo: (name: string) => void
) {
  const wrapped = fn as typeof fn & {
    skip: typeof skip
    only: typeof only
    todo: typeof todo
    each: <T>(cases: T[]) => (name: string, fn: (arg: T) => void) => void
  }

  wrapped.skip = skip
  wrapped.only = only
  wrapped.todo = todo
  wrapped.each = <T>(cases: T[]) => (name: string, testFn: (arg: T) => void) => {
    cases.forEach((testCase, index) => {
      fn(`${name} [${index}]`, () => testFn(testCase))
    })
  }

  return wrapped
}

function wrapTest(
  fn: (name: string, fn: () => void | Promise<void>) => void,
  skip: (name: string, fn: () => void | Promise<void>) => void,
  only: (name: string, fn: () => void | Promise<void>) => void,
  todo: (name: string) => void
) {
  const wrapped = fn as typeof fn & {
    skip: typeof skip
    only: typeof only
    todo: typeof todo
    each: <T>(cases: T[]) => (name: string, fn: (arg: T) => void | Promise<void>) => void
    concurrent: typeof fn
  }

  wrapped.skip = skip
  wrapped.only = only
  wrapped.todo = todo
  wrapped.each = <T>(cases: T[]) => (name: string, testFn: (arg: T) => void | Promise<void>) => {
    cases.forEach((testCase, index) => {
      fn(`${name} [${index}]`, () => testFn(testCase))
    })
  }
  // Bun runs tests concurrently by default
  wrapped.concurrent = fn

  return wrapped
}

export async function createBunProvider(): Promise<TestingProvider> {
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
  } = bunTestModule!

  const { render, screen, cleanup, waitFor, act } = rtlModule!
  const userEvent = userEventModule!.default

  const mockFunctions = createMockFunctions(bunTestModule!)

  // Wrap describe/it/test with additional methods
  const wrappedDescribe = wrapSuite(
    describe,
    describe.skip,
    describe.only,
    describe.todo
  )

  const wrappedIt = wrapTest(
    it,
    it.skip,
    it.only,
    it.todo
  )

  const wrappedTest = wrapTest(
    test,
    test.skip,
    test.only,
    test.todo
  )

  return {
    // Provider metadata
    name: 'bun',
    version: Bun.version,

    // Test definition
    describe: wrappedDescribe,
    it: wrappedIt,
    test: wrappedTest,

    // Lifecycle hooks
    beforeAll,
    afterAll,
    beforeEach,
    afterEach,

    // Assertions - Bun's expect is compatible with Jest/Vitest
    expect: expect as unknown as TestingProvider['expect'],

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

// Synchronous version
export function getBunProviderSync(): TestingProvider {
  if (!bunTestModule || !rtlModule || !userEventModule) {
    throw new Error(
      'Bun provider not initialized. Call createBunProvider() first or use dynamic imports.'
    )
  }

  const {
    describe,
    it,
    test,
    beforeAll,
    afterAll,
    beforeEach,
    afterEach,
    expect,
  } = bunTestModule

  const { render, screen, cleanup, waitFor, act } = rtlModule
  const userEvent = userEventModule.default

  const mockFunctions = createMockFunctions(bunTestModule)

  const wrappedDescribe = wrapSuite(
    describe,
    describe.skip,
    describe.only,
    describe.todo
  )

  const wrappedIt = wrapTest(
    it,
    it.skip,
    it.only,
    it.todo
  )

  const wrappedTest = wrapTest(
    test,
    test.skip,
    test.only,
    test.todo
  )

  return {
    name: 'bun',
    version: Bun.version,
    describe: wrappedDescribe,
    it: wrappedIt,
    test: wrappedTest,
    beforeAll,
    afterAll,
    beforeEach,
    afterEach,
    expect: expect as unknown as TestingProvider['expect'],
    vi: mockFunctions,
    mock: mockFunctions,
    skip: () => {
      throw new Error('Use it.skip or describe.skip instead')
    },
    only: () => {
      throw new Error('Use it.only or describe.only instead')
    },
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

export default createBunProvider
