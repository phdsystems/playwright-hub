/**
 * MockCacheStorage - Mock Cache API for testing
 *
 * Simulates browser cache storage for PWA and offline-first testing
 */

export interface MockCacheInstance {
  name: string
  entries: Map<string, Response>
  match: ReturnType<typeof vi.fn>
  matchAll: ReturnType<typeof vi.fn>
  add: ReturnType<typeof vi.fn>
  addAll: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  keys: ReturnType<typeof vi.fn>
}

export interface MockCacheStorageReturn {
  caches: Map<string, MockCacheInstance>
  getCacheNames: () => string[]
  getCache: (name: string) => MockCacheInstance | undefined
  addToCache: (cacheName: string, url: string, response: Response) => void
  getAllCachedUrls: (cacheName: string) => string[]
  clearCache: (cacheName: string) => void
  cleanup: () => void
}

/**
 * Sets up mock for Cache Storage API
 *
 * @example
 * ```typescript
 * import { setupMockCacheStorage } from '@ux.qa/frontmock'
 *
 * const { addToCache, getCache, cleanup } = setupMockCacheStorage()
 *
 * // Pre-populate cache with expected resources
 * addToCache('my-app-v1', '/api/data', new Response(JSON.stringify({ items: [] })))
 * addToCache('my-app-v1', '/styles.css', new Response('body {}'))
 *
 * render(<PWAComponent />)
 *
 * // Verify component uses cached data when offline
 * const cache = getCache('my-app-v1')
 * expect(cache?.match).toHaveBeenCalledWith('/api/data')
 *
 * cleanup()
 * ```
 */
export function setupMockCacheStorage(): MockCacheStorageReturn {
  const caches = new Map<string, MockCacheInstance>()

  const createMockCache = (name: string): MockCacheInstance => {
    const entries = new Map<string, Response>()

    const cache: MockCacheInstance = {
      name,
      entries,

      match: vi.fn(async (request: RequestInfo | URL, options?: CacheQueryOptions): Promise<Response | undefined> => {
        const url = getUrl(request)
        const response = entries.get(url)
        return response ? response.clone() : undefined
      }),

      matchAll: vi.fn(async (request?: RequestInfo | URL, options?: CacheQueryOptions): Promise<readonly Response[]> => {
        if (!request) {
          return Array.from(entries.values()).map((r) => r.clone())
        }
        const url = getUrl(request)
        const response = entries.get(url)
        return response ? [response.clone()] : []
      }),

      add: vi.fn(async (request: RequestInfo | URL): Promise<void> => {
        const url = getUrl(request)
        // In real implementation, this would fetch the resource
        entries.set(url, new Response('', { status: 200 }))
      }),

      addAll: vi.fn(async (requests: RequestInfo[]): Promise<void> => {
        for (const request of requests) {
          await cache.add(request)
        }
      }),

      put: vi.fn(async (request: RequestInfo | URL, response: Response): Promise<void> => {
        const url = getUrl(request)
        entries.set(url, response.clone())
      }),

      delete: vi.fn(async (request: RequestInfo | URL, options?: CacheQueryOptions): Promise<boolean> => {
        const url = getUrl(request)
        return entries.delete(url)
      }),

      keys: vi.fn(async (request?: RequestInfo | URL, options?: CacheQueryOptions): Promise<readonly Request[]> => {
        const urls = Array.from(entries.keys())
        if (request) {
          const targetUrl = getUrl(request)
          return urls.filter((u) => u === targetUrl).map((u) => new Request(u))
        }
        return urls.map((u) => new Request(u))
      }),
    }

    return cache
  }

  const getUrl = (request: RequestInfo | URL): string => {
    if (typeof request === 'string') return request
    if (request instanceof URL) return request.href
    return request.url
  }

  const mockCacheStorage: CacheStorage = {
    open: vi.fn(async (cacheName: string): Promise<Cache> => {
      if (!caches.has(cacheName)) {
        caches.set(cacheName, createMockCache(cacheName))
      }
      return caches.get(cacheName) as unknown as Cache
    }),

    has: vi.fn(async (cacheName: string): Promise<boolean> => {
      return caches.has(cacheName)
    }),

    delete: vi.fn(async (cacheName: string): Promise<boolean> => {
      return caches.delete(cacheName)
    }),

    keys: vi.fn(async (): Promise<string[]> => {
      return Array.from(caches.keys())
    }),

    match: vi.fn(async (request: RequestInfo | URL, options?: MultiCacheQueryOptions): Promise<Response | undefined> => {
      const url = getUrl(request)

      // Search through all caches
      for (const cache of caches.values()) {
        const response = cache.entries.get(url)
        if (response) {
          return response.clone()
        }
      }
      return undefined
    }),
  }

  const originalCaches = global.caches

  // Install mock
  Object.defineProperty(global, 'caches', {
    writable: true,
    configurable: true,
    value: mockCacheStorage,
  })

  const getCacheNames = (): string[] => {
    return Array.from(caches.keys())
  }

  const getCache = (name: string): MockCacheInstance | undefined => {
    return caches.get(name)
  }

  const addToCache = (cacheName: string, url: string, response: Response) => {
    if (!caches.has(cacheName)) {
      caches.set(cacheName, createMockCache(cacheName))
    }
    caches.get(cacheName)!.entries.set(url, response.clone())
  }

  const getAllCachedUrls = (cacheName: string): string[] => {
    const cache = caches.get(cacheName)
    if (!cache) return []
    return Array.from(cache.entries.keys())
  }

  const clearCache = (cacheName: string) => {
    const cache = caches.get(cacheName)
    if (cache) {
      cache.entries.clear()
    }
  }

  const cleanup = () => {
    caches.clear()

    // Restore original
    Object.defineProperty(global, 'caches', {
      writable: true,
      configurable: true,
      value: originalCaches,
    })
  }

  return {
    caches,
    getCacheNames,
    getCache,
    addToCache,
    getAllCachedUrls,
    clearCache,
    cleanup,
  }
}

/**
 * Common cache names for PWA strategies
 */
export const CacheNames = {
  RUNTIME: 'runtime-cache',
  STATIC: 'static-assets',
  IMAGES: 'image-cache',
  API: 'api-cache',
  PAGES: 'pages-cache',
  FONTS: 'fonts-cache',
} as const

/**
 * Cache strategies for common patterns
 */
export const CacheStrategy = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
} as const

/**
 * Helper to create a mock Response with common defaults
 */
export function createMockResponse(
  body: BodyInit | null,
  options?: {
    status?: number
    statusText?: string
    headers?: HeadersInit
    contentType?: string
  }
): Response {
  const headers = new Headers(options?.headers)

  if (options?.contentType) {
    headers.set('Content-Type', options.contentType)
  }

  return new Response(body, {
    status: options?.status ?? 200,
    statusText: options?.statusText ?? 'OK',
    headers,
  })
}

/**
 * Common content types for cached responses
 */
export const ContentType = {
  JSON: 'application/json',
  HTML: 'text/html',
  CSS: 'text/css',
  JS: 'application/javascript',
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  SVG: 'image/svg+xml',
  WOFF2: 'font/woff2',
} as const
