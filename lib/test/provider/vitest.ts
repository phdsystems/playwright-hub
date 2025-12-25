/**
 * Vitest Provider Implementation
 *
 * Adapts Vitest APIs to the TestingProvider SPI
 */

import type { TestingProvider, MockFunctions } from '../types'

let vitestModule: typeof import('vitest') | null = null
let rtlModule: typeof import('@testing-library/react') | null = null
let userEventModule: typeof import('@testing-library/user-event') | null = null

async function loadModules() {
  if (!vitestModule) {
    vitestModule = await import('vitest')
  }
  if (!rtlModule) {
    rtlModule = await import('@testing-library/react')
  }
  if (!userEventModule) {
    userEventModule = await import('@testing-library/user-event')
  }
}

function createMockFunctions(vi: typeof import('vitest').vi): MockFunctions {
  return {
    fn: vi.fn.bind(vi) as MockFunctions['fn'],
    spyOn: vi.spyOn.bind(vi) as MockFunctions['spyOn'],
    stubGlobal: vi.stubGlobal.bind(vi),
    unstubAllGlobals: vi.unstubAllGlobals.bind(vi),
    clearAllMocks: vi.clearAllMocks.bind(vi),
    resetAllMocks: vi.resetAllMocks.bind(vi),
    restoreAllMocks: vi.restoreAllMocks.bind(vi),
  }
}

export async function createVitestProvider(): Promise<TestingProvider> {
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
    vi,
  } = vitestModule!

  const { render, screen, cleanup, waitFor, act } = rtlModule!
  const userEvent = userEventModule!.default

  const mockFunctions = createMockFunctions(vi)

  return {
    // Provider metadata
    name: 'vitest',
    version: '4.x',

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

// Synchronous version for when modules are already loaded
export function getVitestProviderSync(): TestingProvider {
  if (!vitestModule || !rtlModule || !userEventModule) {
    throw new Error(
      'Vitest provider not initialized. Call createVitestProvider() first or use dynamic imports.'
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
    vi,
  } = vitestModule

  const { render, screen, cleanup, waitFor, act } = rtlModule
  const userEvent = userEventModule.default

  const mockFunctions = createMockFunctions(vi)

  return {
    name: 'vitest',
    version: '4.x',
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
    beforeAll,
    afterAll,
    beforeEach,
    afterEach,
    expect: expect as TestingProvider['expect'],
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

export default createVitestProvider
