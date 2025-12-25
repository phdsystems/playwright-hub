/**
 * MockStorage - Mock localStorage and sessionStorage for testing
 *
 * Isolates tests from browser storage and provides tracking utilities
 */

export interface MockStorageReturn {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
  key: (index: number) => string | null
  length: number
  storage: Record<string, string>
  cleanup: () => void
}

/**
 * Sets up mock for localStorage
 *
 * @example
 * ```typescript
 * import { setupMockLocalStorage } from '@ux.qa/frontmock'
 *
 * const { setItem, getItem, storage, cleanup } = setupMockLocalStorage()
 *
 * // Test component that uses localStorage
 * render(<UserSettings />)
 *
 * // Component stores theme preference
 * expect(storage.theme).toBe('dark')
 * expect(getItem('theme')).toBe('dark')
 *
 * // Cleanup after test
 * cleanup()
 * ```
 */
export function setupMockLocalStorage(): MockStorageReturn {
  const storage: Record<string, string> = {}

  const mockStorage: Storage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => {
      storage[key] = String(value)
    },
    removeItem: (key: string) => {
      delete storage[key]
    },
    clear: () => {
      Object.keys(storage).forEach((key) => delete storage[key])
    },
    key: (index: number) => {
      const keys = Object.keys(storage)
      return keys[index] ?? null
    },
    get length() {
      return Object.keys(storage).length
    },
  }

  const originalLocalStorage = window.localStorage

  // Install mock
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: mockStorage,
  })

  const cleanup = () => {
    // Restore original
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: originalLocalStorage,
    })
    Object.keys(storage).forEach((key) => delete storage[key])
  }

  return {
    getItem: mockStorage.getItem,
    setItem: mockStorage.setItem,
    removeItem: mockStorage.removeItem,
    clear: mockStorage.clear,
    key: mockStorage.key,
    get length() {
      return mockStorage.length
    },
    storage,
    cleanup,
  }
}

/**
 * Sets up mock for sessionStorage
 *
 * @example
 * ```typescript
 * import { setupMockSessionStorage } from '@ux.qa/frontmock'
 *
 * const { setItem, storage, cleanup } = setupMockSessionStorage()
 *
 * // Test component that uses sessionStorage
 * render(<ShoppingCart />)
 *
 * // Component stores cart items
 * expect(storage.cart).toBeDefined()
 *
 * cleanup()
 * ```
 */
export function setupMockSessionStorage(): MockStorageReturn {
  const storage: Record<string, string> = {}

  const mockStorage: Storage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => {
      storage[key] = String(value)
    },
    removeItem: (key: string) => {
      delete storage[key]
    },
    clear: () => {
      Object.keys(storage).forEach((key) => delete storage[key])
    },
    key: (index: number) => {
      const keys = Object.keys(storage)
      return keys[index] ?? null
    },
    get length() {
      return Object.keys(storage).length
    },
  }

  const originalSessionStorage = window.sessionStorage

  // Install mock
  Object.defineProperty(window, 'sessionStorage', {
    writable: true,
    value: mockStorage,
  })

  const cleanup = () => {
    // Restore original
    Object.defineProperty(window, 'sessionStorage', {
      writable: true,
      value: originalSessionStorage,
    })
    Object.keys(storage).forEach((key) => delete storage[key])
  }

  return {
    getItem: mockStorage.getItem,
    setItem: mockStorage.setItem,
    removeItem: mockStorage.removeItem,
    clear: mockStorage.clear,
    key: mockStorage.key,
    get length() {
      return mockStorage.length
    },
    storage,
    cleanup,
  }
}

/**
 * Helper to create storage with initial data
 *
 * @example
 * ```typescript
 * const { storage } = setupMockLocalStorage()
 * mockStorageData(storage, { theme: 'dark', locale: 'en' })
 *
 * render(<App />)
 * // App reads initial storage values
 * ```
 */
export function mockStorageData(
  storage: Record<string, string>,
  data: Record<string, any>
) {
  Object.entries(data).forEach(([key, value]) => {
    storage[key] = typeof value === 'string' ? value : JSON.stringify(value)
  })
}
