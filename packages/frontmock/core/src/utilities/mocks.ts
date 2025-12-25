/**
 * Mock Utilities
 *
 * Common mock helpers for testing
 */

/**
 * Create a mock function with call tracking
 */
export function createMock<T extends (...args: any[]) => any>(
  implementation?: T
): T & {
  calls: Parameters<T>[]
  results: ReturnType<T>[]
  clear: () => void
} {
  const calls: Parameters<T>[] = []
  const results: ReturnType<T>[] = []

  const mockFn = ((...args: Parameters<T>) => {
    calls.push(args)
    const result = implementation ? implementation(...args) : undefined
    results.push(result)
    return result
  }) as any

  mockFn.calls = calls
  mockFn.results = results
  mockFn.clear = () => {
    calls.length = 0
    results.length = 0
  }

  return mockFn
}

/**
 * Create a mock object with all methods mocked
 */
export function createMockObject<T extends Record<string, any>>(
  partial?: Partial<T>
): T {
  return new Proxy({} as T, {
    get(target, prop) {
      if (partial && prop in partial) {
        return partial[prop as keyof T]
      }
      if (!(prop in target)) {
        target[prop as keyof T] = createMock() as any
      }
      return target[prop as keyof T]
    },
  })
}

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key])
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] || null,
  }
}

/**
 * Mock fetch
 */
export function mockFetch(
  responses: Record<string, any> = {}
): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    const response = responses[url] || { status: 404 }

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status || 200,
      statusText: response.statusText || 'OK',
      headers: new Headers(response.headers || {}),
      json: async () => response.body || response,
      text: async () => JSON.stringify(response.body || response),
      blob: async () => new Blob([JSON.stringify(response.body || response)]),
      arrayBuffer: async () => new ArrayBuffer(0),
      formData: async () => new FormData(),
      clone: () => this as Response,
    } as Response
  }
}

/**
 * Mock console methods
 */
export function mockConsole() {
  const original = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  }

  const logs: string[] = []
  const errors: string[] = []
  const warns: string[] = []
  const infos: string[] = []

  console.log = (...args: any[]) => logs.push(args.join(' '))
  console.error = (...args: any[]) => errors.push(args.join(' '))
  console.warn = (...args: any[]) => warns.push(args.join(' '))
  console.info = (...args: any[]) => infos.push(args.join(' '))

  return {
    logs,
    errors,
    warns,
    infos,
    restore: () => {
      console.log = original.log
      console.error = original.error
      console.warn = original.warn
      console.info = original.info
    },
  }
}
