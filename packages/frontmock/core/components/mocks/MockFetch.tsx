/**
 * MockFetch - Mock global fetch() API for testing
 *
 * Allows testing HTTP requests without actual network calls
 */

export interface MockFetchResponse {
  status?: number
  statusText?: string
  headers?: Record<string, string>
  body?: unknown
  ok?: boolean
}

export interface MockFetchCall {
  url: string
  options?: RequestInit
  timestamp: number
}

export interface MockFetchReturn {
  mockFetch: ReturnType<typeof vi.fn>
  mockResponse: (urlPattern: string | RegExp, response: MockFetchResponse, options?: { once?: boolean }) => void
  mockOnce: (response: MockFetchResponse) => void
  mockError: (error: Error) => void
  mockNetworkError: () => void
  mockTimeout: (delayMs?: number) => void
  setDefaultResponse: (response: MockFetchResponse) => void
  setDelay: (delayMs: number) => void
  getCalls: () => MockFetchCall[]
  getCallsForUrl: (urlPattern: string | RegExp) => MockFetchCall[]
  clearCalls: () => void
  cleanup: () => void
}

/**
 * Creates a mock Response object from MockFetchResponse
 */
function createMockResponse(response: MockFetchResponse): Response {
  const status = response.status ?? 200
  const statusText = response.statusText ?? 'OK'
  const headers = new Headers(response.headers ?? {})
  const ok = response.ok ?? (status >= 200 && status < 300)

  let bodyContent: string
  let contentType = headers.get('Content-Type')

  if (response.body === undefined || response.body === null) {
    bodyContent = ''
  } else if (typeof response.body === 'string') {
    bodyContent = response.body
    if (!contentType) {
      headers.set('Content-Type', 'text/plain')
    }
  } else if (response.body instanceof Blob) {
    bodyContent = ''
  } else {
    bodyContent = JSON.stringify(response.body)
    if (!contentType) {
      headers.set('Content-Type', 'application/json')
    }
  }

  const blob = response.body instanceof Blob ? response.body : new Blob([bodyContent])

  return {
    ok,
    status,
    statusText,
    headers,
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: function() { return createMockResponse(response) },
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => blob.arrayBuffer(),
    blob: async () => blob,
    formData: async () => new FormData(),
    json: async () => {
      if (typeof response.body === 'string') {
        return JSON.parse(response.body)
      }
      return response.body
    },
    text: async () => bodyContent,
    bytes: async () => new Uint8Array(await blob.arrayBuffer()),
  } as Response
}

/**
 * Sets up mock for global fetch() API
 *
 * @example
 * ```typescript
 * import { setupMockFetch, FetchPresets } from '@ux.qa/frontmock'
 *
 * const { mockResponse, mockOnce, getCalls, cleanup } = setupMockFetch()
 *
 * // Mock specific URL with JSON response
 * mockResponse('/api/users', { body: [{ id: 1, name: 'John' }] })
 *
 * // Mock one-time response
 * mockOnce({ status: 201, body: { id: 2, name: 'Jane' } })
 *
 * // Use presets for common responses
 * mockResponse('/api/error', FetchPresets.notFound)
 *
 * render(<UserList />)
 *
 * await waitFor(() => {
 *   expect(screen.getByText('John')).toBeInTheDocument()
 * })
 *
 * // Verify fetch was called
 * expect(getCalls()).toHaveLength(1)
 * expect(getCalls()[0].url).toContain('/api/users')
 *
 * cleanup()
 * ```
 *
 * @example
 * ```typescript
 * // Testing loading states with delay
 * const { setDelay, cleanup } = setupMockFetch()
 *
 * setDelay(1000)
 * mockResponse('/api/data', { body: { loaded: true } })
 *
 * render(<LoadingComponent />)
 *
 * // Initially shows loading
 * expect(screen.getByText('Loading...')).toBeInTheDocument()
 *
 * // After delay, shows data
 * await waitFor(() => {
 *   expect(screen.getByText('loaded: true')).toBeInTheDocument()
 * }, { timeout: 2000 })
 *
 * cleanup()
 * ```
 *
 * @example
 * ```typescript
 * // Testing error handling
 * const { mockNetworkError, mockTimeout, cleanup } = setupMockFetch()
 *
 * // Simulate network failure
 * mockNetworkError()
 * render(<DataFetcher />)
 * await waitFor(() => {
 *   expect(screen.getByText('Network error')).toBeInTheDocument()
 * })
 *
 * cleanup()
 * ```
 */
export function setupMockFetch(): MockFetchReturn {
  const calls: MockFetchCall[] = []
  const urlMocks = new Map<string | RegExp, { response: MockFetchResponse; once: boolean }>()
  let onceResponse: MockFetchResponse | null = null
  let onceError: Error | null = null
  let defaultResponse: MockFetchResponse = { status: 200, body: {} }
  let globalDelay = 0

  const originalFetch = globalThis.fetch

  const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

    // Track the call
    calls.push({
      url,
      options: init,
      timestamp: Date.now(),
    })

    // Apply delay if set
    if (globalDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, globalDelay))
    }

    // Check for one-time error
    if (onceError) {
      const error = onceError
      onceError = null
      throw error
    }

    // Check for one-time response
    if (onceResponse) {
      const response = onceResponse
      onceResponse = null
      return createMockResponse(response)
    }

    // Check URL-specific mocks
    for (const [pattern, config] of urlMocks.entries()) {
      const matches =
        typeof pattern === 'string'
          ? url.includes(pattern)
          : pattern.test(url)

      if (matches) {
        const response = createMockResponse(config.response)
        if (config.once) {
          urlMocks.delete(pattern)
        }
        return response
      }
    }

    // Return default response
    return createMockResponse(defaultResponse)
  })

  // Install mock
  Object.defineProperty(globalThis, 'fetch', {
    writable: true,
    configurable: true,
    value: mockFetch,
  })

  const mockResponse = (
    urlPattern: string | RegExp,
    response: MockFetchResponse,
    options?: { once?: boolean }
  ) => {
    urlMocks.set(urlPattern, {
      response,
      once: options?.once ?? false,
    })
  }

  const mockOnce = (response: MockFetchResponse) => {
    onceResponse = response
  }

  const mockError = (error: Error) => {
    onceError = error
  }

  const mockNetworkError = () => {
    onceError = new TypeError('Failed to fetch')
  }

  const mockTimeout = (delayMs = 30000) => {
    const timeoutError = new DOMException('The operation was aborted.', 'AbortError')
    onceError = timeoutError
    // Also set delay to simulate the timeout period
    if (delayMs > 0) {
      globalDelay = delayMs
    }
  }

  const setDefaultResponse = (response: MockFetchResponse) => {
    defaultResponse = response
  }

  const setDelay = (delayMs: number) => {
    globalDelay = delayMs
  }

  const getCalls = (): MockFetchCall[] => {
    return [...calls]
  }

  const getCallsForUrl = (urlPattern: string | RegExp): MockFetchCall[] => {
    return calls.filter((call) => {
      if (typeof urlPattern === 'string') {
        return call.url.includes(urlPattern)
      }
      return urlPattern.test(call.url)
    })
  }

  const clearCalls = () => {
    calls.length = 0
  }

  const cleanup = () => {
    // Restore original fetch
    Object.defineProperty(globalThis, 'fetch', {
      writable: true,
      configurable: true,
      value: originalFetch,
    })
    calls.length = 0
    urlMocks.clear()
    onceResponse = null
    onceError = null
    defaultResponse = { status: 200, body: {} }
    globalDelay = 0
    mockFetch.mockClear()
  }

  return {
    mockFetch,
    mockResponse,
    mockOnce,
    mockError,
    mockNetworkError,
    mockTimeout,
    setDefaultResponse,
    setDelay,
    getCalls,
    getCallsForUrl,
    clearCalls,
    cleanup,
  }
}

/**
 * Common fetch response presets for testing
 */
export const FetchPresets = {
  /** Successful empty response */
  success: {
    status: 200,
    statusText: 'OK',
    body: {},
  } as MockFetchResponse,

  /** Created response (201) */
  created: {
    status: 201,
    statusText: 'Created',
    body: {},
  } as MockFetchResponse,

  /** No content response (204) */
  noContent: {
    status: 204,
    statusText: 'No Content',
    body: null,
  } as MockFetchResponse,

  /** Bad request response (400) */
  badRequest: {
    status: 400,
    statusText: 'Bad Request',
    body: { error: 'Bad Request' },
  } as MockFetchResponse,

  /** Unauthorized response (401) */
  unauthorized: {
    status: 401,
    statusText: 'Unauthorized',
    body: { error: 'Unauthorized' },
  } as MockFetchResponse,

  /** Forbidden response (403) */
  forbidden: {
    status: 403,
    statusText: 'Forbidden',
    body: { error: 'Forbidden' },
  } as MockFetchResponse,

  /** Not found response (404) */
  notFound: {
    status: 404,
    statusText: 'Not Found',
    body: { error: 'Not Found' },
  } as MockFetchResponse,

  /** Method not allowed response (405) */
  methodNotAllowed: {
    status: 405,
    statusText: 'Method Not Allowed',
    body: { error: 'Method Not Allowed' },
  } as MockFetchResponse,

  /** Conflict response (409) */
  conflict: {
    status: 409,
    statusText: 'Conflict',
    body: { error: 'Conflict' },
  } as MockFetchResponse,

  /** Unprocessable entity response (422) */
  unprocessableEntity: {
    status: 422,
    statusText: 'Unprocessable Entity',
    body: { error: 'Unprocessable Entity' },
  } as MockFetchResponse,

  /** Too many requests response (429) */
  tooManyRequests: {
    status: 429,
    statusText: 'Too Many Requests',
    body: { error: 'Too Many Requests' },
    headers: { 'Retry-After': '60' },
  } as MockFetchResponse,

  /** Internal server error response (500) */
  serverError: {
    status: 500,
    statusText: 'Internal Server Error',
    body: { error: 'Internal Server Error' },
  } as MockFetchResponse,

  /** Bad gateway response (502) */
  badGateway: {
    status: 502,
    statusText: 'Bad Gateway',
    body: { error: 'Bad Gateway' },
  } as MockFetchResponse,

  /** Service unavailable response (503) */
  serviceUnavailable: {
    status: 503,
    statusText: 'Service Unavailable',
    body: { error: 'Service Unavailable' },
  } as MockFetchResponse,

  /** Gateway timeout response (504) */
  gatewayTimeout: {
    status: 504,
    statusText: 'Gateway Timeout',
    body: { error: 'Gateway Timeout' },
  } as MockFetchResponse,
} as const

/**
 * Helper to create JSON response with custom data
 */
export function jsonResponse<T>(data: T, status = 200): MockFetchResponse {
  return {
    status,
    statusText: status === 200 ? 'OK' : status === 201 ? 'Created' : 'Response',
    headers: { 'Content-Type': 'application/json' },
    body: data,
  }
}

/**
 * Helper to create text response
 */
export function textResponse(text: string, status = 200): MockFetchResponse {
  return {
    status,
    statusText: 'OK',
    headers: { 'Content-Type': 'text/plain' },
    body: text,
  }
}

/**
 * Helper to create HTML response
 */
export function htmlResponse(html: string, status = 200): MockFetchResponse {
  return {
    status,
    statusText: 'OK',
    headers: { 'Content-Type': 'text/html' },
    body: html,
  }
}

/**
 * Helper to create error response with custom message
 */
export function errorResponse(
  status: number,
  message: string,
  details?: Record<string, unknown>
): MockFetchResponse {
  return {
    status,
    statusText: message,
    headers: { 'Content-Type': 'application/json' },
    body: { error: message, ...details },
  }
}
