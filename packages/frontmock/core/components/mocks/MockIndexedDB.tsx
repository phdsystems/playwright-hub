/**
 * MockIndexedDB - Mock IndexedDB API for testing
 *
 * Allows testing database operations with in-memory storage
 */

export interface MockIDBDatabase {
  name: string
  version: number
  objectStoreNames: DOMStringList
  createObjectStore: ReturnType<typeof vi.fn>
  deleteObjectStore: ReturnType<typeof vi.fn>
  transaction: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
  onclose: ((this: IDBDatabase, ev: Event) => unknown) | null
  onerror: ((this: IDBDatabase, ev: Event) => unknown) | null
  onversionchange: ((this: IDBDatabase, ev: IDBVersionChangeEvent) => unknown) | null
  onabort: ((this: IDBDatabase, ev: Event) => unknown) | null
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  dispatchEvent: ReturnType<typeof vi.fn>
}

export interface MockIDBObjectStore {
  name: string
  keyPath: string | string[] | null
  indexNames: DOMStringList
  autoIncrement: boolean
  transaction: MockIDBTransaction
  add: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
  get: ReturnType<typeof vi.fn>
  getAll: ReturnType<typeof vi.fn>
  getAllKeys: ReturnType<typeof vi.fn>
  getKey: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  clear: ReturnType<typeof vi.fn>
  count: ReturnType<typeof vi.fn>
  openCursor: ReturnType<typeof vi.fn>
  openKeyCursor: ReturnType<typeof vi.fn>
  createIndex: ReturnType<typeof vi.fn>
  deleteIndex: ReturnType<typeof vi.fn>
  index: ReturnType<typeof vi.fn>
}

export interface MockIDBTransaction {
  db: MockIDBDatabase
  mode: IDBTransactionMode
  objectStoreNames: DOMStringList
  error: DOMException | null
  durability: IDBTransactionDurability
  objectStore: ReturnType<typeof vi.fn>
  commit: ReturnType<typeof vi.fn>
  abort: ReturnType<typeof vi.fn>
  onabort: ((this: IDBTransaction, ev: Event) => unknown) | null
  oncomplete: ((this: IDBTransaction, ev: Event) => unknown) | null
  onerror: ((this: IDBTransaction, ev: Event) => unknown) | null
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  dispatchEvent: ReturnType<typeof vi.fn>
}

export interface MockIDBRequest<T = unknown> {
  result: T
  error: DOMException | null
  source: MockIDBObjectStore | MockIDBIndex | MockIDBCursor | null
  transaction: MockIDBTransaction | null
  readyState: IDBRequestReadyState
  onsuccess: ((this: IDBRequest<T>, ev: Event) => unknown) | null
  onerror: ((this: IDBRequest<T>, ev: Event) => unknown) | null
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  dispatchEvent: ReturnType<typeof vi.fn>
}

export interface MockIDBCursor {
  source: MockIDBObjectStore | MockIDBIndex
  direction: IDBCursorDirection
  key: IDBValidKey
  primaryKey: IDBValidKey
  request: MockIDBRequest
  advance: ReturnType<typeof vi.fn>
  continue: ReturnType<typeof vi.fn>
  continuePrimaryKey: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
}

export interface MockIDBCursorWithValue extends MockIDBCursor {
  value: unknown
}

export interface MockIDBIndex {
  name: string
  objectStore: MockIDBObjectStore
  keyPath: string | string[]
  multiEntry: boolean
  unique: boolean
  get: ReturnType<typeof vi.fn>
  getKey: ReturnType<typeof vi.fn>
  getAll: ReturnType<typeof vi.fn>
  getAllKeys: ReturnType<typeof vi.fn>
  count: ReturnType<typeof vi.fn>
  openCursor: ReturnType<typeof vi.fn>
  openKeyCursor: ReturnType<typeof vi.fn>
}

export interface MockIDBOpenDBRequest extends MockIDBRequest<MockIDBDatabase> {
  onblocked: ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => unknown) | null
  onupgradeneeded: ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => unknown) | null
}

export interface StoreSchema {
  name: string
  keyPath?: string | string[]
  autoIncrement?: boolean
  indexes?: Array<{
    name: string
    keyPath: string | string[]
    options?: IDBIndexParameters
  }>
  data?: Array<{ key?: IDBValidKey; value: unknown }>
}

export interface DatabaseSchema {
  name: string
  version: number
  stores: StoreSchema[]
}

export interface MockIndexedDBReturn {
  mockOpen: ReturnType<typeof vi.fn>
  mockDeleteDatabase: ReturnType<typeof vi.fn>
  mockDatabases: ReturnType<typeof vi.fn>
  mockCmp: ReturnType<typeof vi.fn>
  getDatabase: (name: string) => Map<string, Map<IDBValidKey, unknown>> | undefined
  getStore: (dbName: string, storeName: string) => Map<IDBValidKey, unknown> | undefined
  seedDatabase: (schema: DatabaseSchema) => void
  clearAllDatabases: () => void
  getAllDatabases: () => Map<string, { version: number; stores: Map<string, Map<IDBValidKey, unknown>> }>
  cleanup: () => void
}

/**
 * Sets up mock for IndexedDB API
 *
 * @example
 * ```typescript
 * import { setupMockIndexedDB } from '@ux.qa/frontmock'
 *
 * const { seedDatabase, getStore, cleanup } = setupMockIndexedDB()
 *
 * // Seed initial data
 * seedDatabase({
 *   name: 'myApp',
 *   version: 1,
 *   stores: [{
 *     name: 'users',
 *     keyPath: 'id',
 *     autoIncrement: true,
 *     data: [
 *       { value: { id: 1, name: 'Alice', email: 'alice@example.com' } },
 *       { value: { id: 2, name: 'Bob', email: 'bob@example.com' } }
 *     ]
 *   }]
 * })
 *
 * render(<UserList />)
 *
 * // Component uses IndexedDB to load users
 * await waitFor(() => {
 *   expect(screen.getByText('Alice')).toBeInTheDocument()
 *   expect(screen.getByText('Bob')).toBeInTheDocument()
 * })
 *
 * // Verify data was stored
 * const users = getStore('myApp', 'users')
 * expect(users?.size).toBe(2)
 *
 * cleanup()
 * ```
 *
 * @example
 * ```typescript
 * // Testing CRUD operations
 * const { mockOpen, cleanup } = setupMockIndexedDB()
 *
 * render(<TodoApp />)
 *
 * // Add a new todo
 * await userEvent.type(screen.getByPlaceholderText('New todo'), 'Buy groceries')
 * await userEvent.click(screen.getByText('Add'))
 *
 * // Verify IndexedDB was called
 * expect(mockOpen).toHaveBeenCalledWith('todos', expect.any(Number))
 *
 * cleanup()
 * ```
 *
 * @example
 * ```typescript
 * // Testing version upgrades
 * const { seedDatabase, cleanup } = setupMockIndexedDB()
 *
 * seedDatabase({
 *   name: 'myApp',
 *   version: 2,
 *   stores: [
 *     { name: 'users', keyPath: 'id' },
 *     { name: 'settings', keyPath: 'key' } // New store in v2
 *   ]
 * })
 *
 * // Your app should handle the upgrade
 * render(<App />)
 *
 * cleanup()
 * ```
 */
export function setupMockIndexedDB(): MockIndexedDBReturn {
  // In-memory storage: dbName -> { version, stores: storeName -> Map<key, value> }
  const databases = new Map<
    string,
    {
      version: number
      stores: Map<string, Map<IDBValidKey, unknown>>
      storeSchemas: Map<string, { keyPath: string | string[] | null; autoIncrement: boolean; indexes: Map<string, { keyPath: string | string[]; unique: boolean; multiEntry: boolean }> }>
    }
  >()

  // Auto-increment counters per store
  const autoIncrementCounters = new Map<string, number>()

  const getAutoIncrementKey = (dbName: string, storeName: string): number => {
    const key = `${dbName}:${storeName}`
    const current = autoIncrementCounters.get(key) ?? 0
    autoIncrementCounters.set(key, current + 1)
    return current + 1
  }

  const createDOMStringList = (items: string[]): DOMStringList => {
    const list = items as unknown as DOMStringList
    Object.defineProperty(list, 'length', { value: items.length, writable: false })
    Object.defineProperty(list, 'contains', {
      value: (str: string) => items.includes(str),
      writable: false,
    })
    Object.defineProperty(list, 'item', {
      value: (index: number) => items[index] ?? null,
      writable: false,
    })
    return list
  }

  const createMockRequest = <T>(
    result: T,
    source: MockIDBObjectStore | MockIDBIndex | MockIDBCursor | null = null,
    transaction: MockIDBTransaction | null = null
  ): MockIDBRequest<T> => {
    const request: MockIDBRequest<T> = {
      result,
      error: null,
      source,
      transaction,
      readyState: 'done',
      onsuccess: null,
      onerror: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    }

    // Trigger onsuccess asynchronously
    setTimeout(() => {
      if (request.onsuccess) {
        const event = new Event('success')
        Object.defineProperty(event, 'target', { value: request })
        request.onsuccess.call(request as unknown as IDBRequest<T>, event)
      }
    }, 0)

    return request
  }

  const createMockCursor = (
    store: MockIDBObjectStore,
    entries: Array<[IDBValidKey, unknown]>,
    direction: IDBCursorDirection = 'next'
  ): MockIDBCursorWithValue | null => {
    if (entries.length === 0) return null

    let currentIndex = direction === 'prev' || direction === 'prevunique' ? entries.length - 1 : 0

    const cursor: MockIDBCursorWithValue = {
      source: store,
      direction,
      key: entries[currentIndex][0],
      primaryKey: entries[currentIndex][0],
      value: entries[currentIndex][1],
      request: null as unknown as MockIDBRequest,
      advance: vi.fn((count: number) => {
        if (direction === 'prev' || direction === 'prevunique') {
          currentIndex -= count
        } else {
          currentIndex += count
        }
        if (currentIndex < 0 || currentIndex >= entries.length) {
          cursor.key = undefined as unknown as IDBValidKey
          cursor.primaryKey = undefined as unknown as IDBValidKey
          cursor.value = undefined
        } else {
          cursor.key = entries[currentIndex][0]
          cursor.primaryKey = entries[currentIndex][0]
          cursor.value = entries[currentIndex][1]
        }
      }),
      continue: vi.fn((key?: IDBValidKey) => {
        if (key !== undefined) {
          const targetIndex = entries.findIndex(([k]) => k === key)
          if (targetIndex !== -1) {
            currentIndex = targetIndex
          } else {
            currentIndex = entries.length
          }
        } else {
          if (direction === 'prev' || direction === 'prevunique') {
            currentIndex--
          } else {
            currentIndex++
          }
        }
        if (currentIndex < 0 || currentIndex >= entries.length) {
          cursor.key = undefined as unknown as IDBValidKey
          cursor.primaryKey = undefined as unknown as IDBValidKey
          cursor.value = undefined
        } else {
          cursor.key = entries[currentIndex][0]
          cursor.primaryKey = entries[currentIndex][0]
          cursor.value = entries[currentIndex][1]
        }
      }),
      continuePrimaryKey: vi.fn(),
      delete: vi.fn(() => {
        const db = databases.get(store.name)
        if (db) {
          const storeData = db.stores.get(store.name)
          storeData?.delete(cursor.key)
        }
        return createMockRequest(undefined)
      }),
      update: vi.fn((value: unknown) => {
        const db = databases.get(store.name)
        if (db) {
          const storeData = db.stores.get(store.name)
          storeData?.set(cursor.key, value)
        }
        cursor.value = value
        return createMockRequest(cursor.key)
      }),
    }

    return cursor
  }

  const createMockIndex = (
    store: MockIDBObjectStore,
    name: string,
    keyPath: string | string[],
    unique: boolean,
    multiEntry: boolean,
    dbName: string
  ): MockIDBIndex => {
    const index: MockIDBIndex = {
      name,
      objectStore: store,
      keyPath,
      multiEntry,
      unique,
      get: vi.fn((key: IDBValidKey) => {
        const db = databases.get(dbName)
        if (!db) return createMockRequest(undefined)
        const storeData = db.stores.get(store.name)
        if (!storeData) return createMockRequest(undefined)

        const indexKeyPath = typeof keyPath === 'string' ? keyPath : keyPath[0]
        for (const [, value] of storeData) {
          if (typeof value === 'object' && value !== null && indexKeyPath in value) {
            if ((value as Record<string, unknown>)[indexKeyPath] === key) {
              return createMockRequest(value)
            }
          }
        }
        return createMockRequest(undefined)
      }),
      getKey: vi.fn((key: IDBValidKey) => {
        const db = databases.get(dbName)
        if (!db) return createMockRequest(undefined)
        const storeData = db.stores.get(store.name)
        if (!storeData) return createMockRequest(undefined)

        const indexKeyPath = typeof keyPath === 'string' ? keyPath : keyPath[0]
        for (const [primaryKey, value] of storeData) {
          if (typeof value === 'object' && value !== null && indexKeyPath in value) {
            if ((value as Record<string, unknown>)[indexKeyPath] === key) {
              return createMockRequest(primaryKey)
            }
          }
        }
        return createMockRequest(undefined)
      }),
      getAll: vi.fn((query?: IDBValidKey | IDBKeyRange, count?: number) => {
        const db = databases.get(dbName)
        if (!db) return createMockRequest([])
        const storeData = db.stores.get(store.name)
        if (!storeData) return createMockRequest([])

        const results: unknown[] = []
        const indexKeyPath = typeof keyPath === 'string' ? keyPath : keyPath[0]

        for (const [, value] of storeData) {
          if (query === undefined) {
            results.push(value)
          } else if (typeof value === 'object' && value !== null && indexKeyPath in value) {
            if ((value as Record<string, unknown>)[indexKeyPath] === query) {
              results.push(value)
            }
          }
          if (count !== undefined && results.length >= count) break
        }
        return createMockRequest(results)
      }),
      getAllKeys: vi.fn((query?: IDBValidKey | IDBKeyRange, count?: number) => {
        const db = databases.get(dbName)
        if (!db) return createMockRequest([])
        const storeData = db.stores.get(store.name)
        if (!storeData) return createMockRequest([])

        const results: IDBValidKey[] = []
        const indexKeyPath = typeof keyPath === 'string' ? keyPath : keyPath[0]

        for (const [primaryKey, value] of storeData) {
          if (query === undefined) {
            results.push(primaryKey)
          } else if (typeof value === 'object' && value !== null && indexKeyPath in value) {
            if ((value as Record<string, unknown>)[indexKeyPath] === query) {
              results.push(primaryKey)
            }
          }
          if (count !== undefined && results.length >= count) break
        }
        return createMockRequest(results)
      }),
      count: vi.fn((key?: IDBValidKey | IDBKeyRange) => {
        const db = databases.get(dbName)
        if (!db) return createMockRequest(0)
        const storeData = db.stores.get(store.name)
        if (!storeData) return createMockRequest(0)

        if (key === undefined) {
          return createMockRequest(storeData.size)
        }

        let count = 0
        const indexKeyPath = typeof keyPath === 'string' ? keyPath : keyPath[0]

        for (const [, value] of storeData) {
          if (typeof value === 'object' && value !== null && indexKeyPath in value) {
            if ((value as Record<string, unknown>)[indexKeyPath] === key) {
              count++
            }
          }
        }
        return createMockRequest(count)
      }),
      openCursor: vi.fn((query?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection) => {
        const db = databases.get(dbName)
        if (!db) return createMockRequest(null)
        const storeData = db.stores.get(store.name)
        if (!storeData) return createMockRequest(null)

        const entries = Array.from(storeData.entries())
        const cursor = createMockCursor(store, entries, direction)
        return createMockRequest(cursor)
      }),
      openKeyCursor: vi.fn((query?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection) => {
        const db = databases.get(dbName)
        if (!db) return createMockRequest(null)
        const storeData = db.stores.get(store.name)
        if (!storeData) return createMockRequest(null)

        const entries = Array.from(storeData.entries())
        const cursor = createMockCursor(store, entries, direction)
        return createMockRequest(cursor)
      }),
    }

    return index
  }

  const createMockObjectStore = (
    name: string,
    keyPath: string | string[] | null,
    autoIncrement: boolean,
    transaction: MockIDBTransaction,
    dbName: string
  ): MockIDBObjectStore => {
    const db = databases.get(dbName)
    const storeSchema = db?.storeSchemas.get(name)
    const indexNames = storeSchema ? Array.from(storeSchema.indexes.keys()) : []

    const store: MockIDBObjectStore = {
      name,
      keyPath,
      indexNames: createDOMStringList(indexNames),
      autoIncrement,
      transaction,
      add: vi.fn((value: unknown, key?: IDBValidKey) => {
        const db = databases.get(dbName)
        if (!db) {
          const request = createMockRequest(undefined, store, transaction)
          request.error = new DOMException('Database not found', 'NotFoundError')
          request.readyState = 'done'
          setTimeout(() => {
            if (request.onerror) {
              const event = new Event('error')
              Object.defineProperty(event, 'target', { value: request })
              request.onerror.call(request as unknown as IDBRequest, event)
            }
          }, 0)
          return request
        }

        let storeData = db.stores.get(name)
        if (!storeData) {
          storeData = new Map()
          db.stores.set(name, storeData)
        }

        let finalKey: IDBValidKey
        if (key !== undefined) {
          finalKey = key
        } else if (autoIncrement) {
          finalKey = getAutoIncrementKey(dbName, name)
          if (typeof value === 'object' && value !== null && keyPath && typeof keyPath === 'string') {
            (value as Record<string, unknown>)[keyPath] = finalKey
          }
        } else if (keyPath && typeof keyPath === 'string' && typeof value === 'object' && value !== null) {
          finalKey = (value as Record<string, unknown>)[keyPath] as IDBValidKey
        } else {
          const request = createMockRequest(undefined, store, transaction)
          request.error = new DOMException('No key provided', 'DataError')
          return request
        }

        if (storeData.has(finalKey)) {
          const request = createMockRequest(undefined, store, transaction)
          request.error = new DOMException('Key already exists', 'ConstraintError')
          setTimeout(() => {
            if (request.onerror) {
              const event = new Event('error')
              Object.defineProperty(event, 'target', { value: request })
              request.onerror.call(request as unknown as IDBRequest, event)
            }
          }, 0)
          return request
        }

        storeData.set(finalKey, value)
        return createMockRequest(finalKey, store, transaction)
      }),
      put: vi.fn((value: unknown, key?: IDBValidKey) => {
        const db = databases.get(dbName)
        if (!db) {
          const request = createMockRequest(undefined, store, transaction)
          request.error = new DOMException('Database not found', 'NotFoundError')
          return request
        }

        let storeData = db.stores.get(name)
        if (!storeData) {
          storeData = new Map()
          db.stores.set(name, storeData)
        }

        let finalKey: IDBValidKey
        if (key !== undefined) {
          finalKey = key
        } else if (autoIncrement && !storeData.has(key as IDBValidKey)) {
          finalKey = getAutoIncrementKey(dbName, name)
          if (typeof value === 'object' && value !== null && keyPath && typeof keyPath === 'string') {
            (value as Record<string, unknown>)[keyPath] = finalKey
          }
        } else if (keyPath && typeof keyPath === 'string' && typeof value === 'object' && value !== null) {
          finalKey = (value as Record<string, unknown>)[keyPath] as IDBValidKey
        } else {
          const request = createMockRequest(undefined, store, transaction)
          request.error = new DOMException('No key provided', 'DataError')
          return request
        }

        storeData.set(finalKey, value)
        return createMockRequest(finalKey, store, transaction)
      }),
      get: vi.fn((key: IDBValidKey) => {
        const db = databases.get(dbName)
        if (!db) return createMockRequest(undefined, store, transaction)
        const storeData = db.stores.get(name)
        if (!storeData) return createMockRequest(undefined, store, transaction)
        return createMockRequest(storeData.get(key), store, transaction)
      }),
      getAll: vi.fn((query?: IDBValidKey | IDBKeyRange, count?: number) => {
        const db = databases.get(dbName)
        if (!db) return createMockRequest([], store, transaction)
        const storeData = db.stores.get(name)
        if (!storeData) return createMockRequest([], store, transaction)

        let results = Array.from(storeData.values())
        if (count !== undefined) {
          results = results.slice(0, count)
        }
        return createMockRequest(results, store, transaction)
      }),
      getAllKeys: vi.fn((query?: IDBValidKey | IDBKeyRange, count?: number) => {
        const db = databases.get(dbName)
        if (!db) return createMockRequest([], store, transaction)
        const storeData = db.stores.get(name)
        if (!storeData) return createMockRequest([], store, transaction)

        let results = Array.from(storeData.keys())
        if (count !== undefined) {
          results = results.slice(0, count)
        }
        return createMockRequest(results, store, transaction)
      }),
      getKey: vi.fn((key: IDBValidKey) => {
        const db = databases.get(dbName)
        if (!db) return createMockRequest(undefined, store, transaction)
        const storeData = db.stores.get(name)
        if (!storeData) return createMockRequest(undefined, store, transaction)
        return createMockRequest(storeData.has(key) ? key : undefined, store, transaction)
      }),
      delete: vi.fn((key: IDBValidKey | IDBKeyRange) => {
        const db = databases.get(dbName)
        if (!db) return createMockRequest(undefined, store, transaction)
        const storeData = db.stores.get(name)
        if (!storeData) return createMockRequest(undefined, store, transaction)

        if (typeof key === 'object' && 'lower' in key) {
          // IDBKeyRange - simplified handling
          for (const k of storeData.keys()) {
            storeData.delete(k)
          }
        } else {
          storeData.delete(key)
        }
        return createMockRequest(undefined, store, transaction)
      }),
      clear: vi.fn(() => {
        const db = databases.get(dbName)
        if (!db) return createMockRequest(undefined, store, transaction)
        const storeData = db.stores.get(name)
        if (storeData) {
          storeData.clear()
        }
        return createMockRequest(undefined, store, transaction)
      }),
      count: vi.fn((key?: IDBValidKey | IDBKeyRange) => {
        const db = databases.get(dbName)
        if (!db) return createMockRequest(0, store, transaction)
        const storeData = db.stores.get(name)
        if (!storeData) return createMockRequest(0, store, transaction)
        return createMockRequest(storeData.size, store, transaction)
      }),
      openCursor: vi.fn((query?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection) => {
        const db = databases.get(dbName)
        if (!db) return createMockRequest(null, store, transaction)
        const storeData = db.stores.get(name)
        if (!storeData) return createMockRequest(null, store, transaction)

        const entries = Array.from(storeData.entries())
        const cursor = createMockCursor(store, entries, direction)
        return createMockRequest(cursor, store, transaction)
      }),
      openKeyCursor: vi.fn((query?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection) => {
        const db = databases.get(dbName)
        if (!db) return createMockRequest(null, store, transaction)
        const storeData = db.stores.get(name)
        if (!storeData) return createMockRequest(null, store, transaction)

        const entries = Array.from(storeData.entries())
        const cursor = createMockCursor(store, entries, direction)
        return createMockRequest(cursor, store, transaction)
      }),
      createIndex: vi.fn((name: string, keyPath: string | string[], options?: IDBIndexParameters) => {
        const db = databases.get(dbName)
        if (db) {
          const storeSchema = db.storeSchemas.get(store.name)
          if (storeSchema) {
            storeSchema.indexes.set(name, {
              keyPath,
              unique: options?.unique ?? false,
              multiEntry: options?.multiEntry ?? false,
            })
          }
        }
        return createMockIndex(store, name, keyPath, options?.unique ?? false, options?.multiEntry ?? false, dbName)
      }),
      deleteIndex: vi.fn((indexName: string) => {
        const db = databases.get(dbName)
        if (db) {
          const storeSchema = db.storeSchemas.get(store.name)
          if (storeSchema) {
            storeSchema.indexes.delete(indexName)
          }
        }
      }),
      index: vi.fn((indexName: string) => {
        const db = databases.get(dbName)
        if (!db) {
          throw new DOMException(`Index "${indexName}" not found`, 'NotFoundError')
        }
        const storeSchema = db.storeSchemas.get(name)
        if (!storeSchema) {
          throw new DOMException(`Object store "${name}" not found`, 'NotFoundError')
        }
        const indexSchema = storeSchema.indexes.get(indexName)
        if (!indexSchema) {
          throw new DOMException(`Index "${indexName}" not found`, 'NotFoundError')
        }
        return createMockIndex(store, indexName, indexSchema.keyPath, indexSchema.unique, indexSchema.multiEntry, dbName)
      }),
    }

    return store
  }

  const createMockTransaction = (
    db: MockIDBDatabase,
    storeNames: string[],
    mode: IDBTransactionMode,
    dbName: string
  ): MockIDBTransaction => {
    const transaction: MockIDBTransaction = {
      db,
      mode,
      objectStoreNames: createDOMStringList(storeNames),
      error: null,
      durability: 'default',
      objectStore: vi.fn((name: string) => {
        if (!storeNames.includes(name)) {
          throw new DOMException(`Object store "${name}" not found in transaction`, 'NotFoundError')
        }
        const dbData = databases.get(dbName)
        const storeSchema = dbData?.storeSchemas.get(name)
        return createMockObjectStore(
          name,
          storeSchema?.keyPath ?? null,
          storeSchema?.autoIncrement ?? false,
          transaction,
          dbName
        )
      }),
      commit: vi.fn(() => {
        setTimeout(() => {
          if (transaction.oncomplete) {
            const event = new Event('complete')
            transaction.oncomplete.call(transaction as unknown as IDBTransaction, event)
          }
        }, 0)
      }),
      abort: vi.fn(() => {
        transaction.error = new DOMException('Transaction aborted', 'AbortError')
        setTimeout(() => {
          if (transaction.onabort) {
            const event = new Event('abort')
            transaction.onabort.call(transaction as unknown as IDBTransaction, event)
          }
        }, 0)
      }),
      onabort: null,
      oncomplete: null,
      onerror: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    }

    // Auto-complete transaction after microtask
    setTimeout(() => {
      if (transaction.oncomplete && !transaction.error) {
        const event = new Event('complete')
        transaction.oncomplete.call(transaction as unknown as IDBTransaction, event)
      }
    }, 0)

    return transaction
  }

  const createMockDatabase = (name: string, version: number): MockIDBDatabase => {
    const dbData = databases.get(name)
    const storeNames = dbData ? Array.from(dbData.stores.keys()) : []

    const db: MockIDBDatabase = {
      name,
      version,
      objectStoreNames: createDOMStringList(storeNames),
      createObjectStore: vi.fn((storeName: string, options?: IDBObjectStoreParameters) => {
        const dbData = databases.get(name)
        if (dbData) {
          if (!dbData.stores.has(storeName)) {
            dbData.stores.set(storeName, new Map())
          }
          dbData.storeSchemas.set(storeName, {
            keyPath: options?.keyPath ?? null,
            autoIncrement: options?.autoIncrement ?? false,
            indexes: new Map(),
          })
          // Update objectStoreNames
          const newStoreNames = Array.from(dbData.stores.keys())
          ;(db as { objectStoreNames: DOMStringList }).objectStoreNames = createDOMStringList(newStoreNames)
        }
        const dummyTransaction = createMockTransaction(db, [storeName], 'versionchange', name)
        return createMockObjectStore(
          storeName,
          options?.keyPath ?? null,
          options?.autoIncrement ?? false,
          dummyTransaction,
          name
        )
      }),
      deleteObjectStore: vi.fn((storeName: string) => {
        const dbData = databases.get(name)
        if (dbData) {
          dbData.stores.delete(storeName)
          dbData.storeSchemas.delete(storeName)
          // Update objectStoreNames
          const newStoreNames = Array.from(dbData.stores.keys())
          ;(db as { objectStoreNames: DOMStringList }).objectStoreNames = createDOMStringList(newStoreNames)
        }
      }),
      transaction: vi.fn((storeNames: string | string[], mode?: IDBTransactionMode, options?: IDBTransactionOptions) => {
        const names = typeof storeNames === 'string' ? [storeNames] : storeNames
        return createMockTransaction(db, names, mode ?? 'readonly', name)
      }),
      close: vi.fn(() => {
        if (db.onclose) {
          const event = new Event('close')
          db.onclose.call(db as unknown as IDBDatabase, event)
        }
      }),
      onclose: null,
      onerror: null,
      onversionchange: null,
      onabort: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    }

    return db
  }

  const mockOpen = vi.fn((name: string, version?: number) => {
    const requestedVersion = version ?? 1
    const existingDb = databases.get(name)
    const needsUpgrade = !existingDb || existingDb.version < requestedVersion

    if (!existingDb) {
      databases.set(name, {
        version: requestedVersion,
        stores: new Map(),
        storeSchemas: new Map(),
      })
    } else if (needsUpgrade) {
      existingDb.version = requestedVersion
    }

    const db = createMockDatabase(name, requestedVersion)

    const request: MockIDBOpenDBRequest = {
      result: db,
      error: null,
      source: null,
      transaction: null,
      readyState: 'pending',
      onsuccess: null,
      onerror: null,
      onblocked: null,
      onupgradeneeded: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    }

    setTimeout(() => {
      request.readyState = 'done'

      if (needsUpgrade && request.onupgradeneeded) {
        const oldVersion = existingDb?.version ?? 0
        const upgradeTransaction = createMockTransaction(db, [], 'versionchange', name)
        ;(request as { transaction: MockIDBTransaction }).transaction = upgradeTransaction

        const event = new Event('upgradeneeded') as IDBVersionChangeEvent
        Object.defineProperty(event, 'oldVersion', { value: oldVersion })
        Object.defineProperty(event, 'newVersion', { value: requestedVersion })
        Object.defineProperty(event, 'target', { value: request })
        request.onupgradeneeded.call(request as unknown as IDBOpenDBRequest, event)
      }

      if (request.onsuccess) {
        const event = new Event('success')
        Object.defineProperty(event, 'target', { value: request })
        request.onsuccess.call(request as unknown as IDBRequest<MockIDBDatabase>, event)
      }
    }, 0)

    return request
  })

  const mockDeleteDatabase = vi.fn((name: string) => {
    databases.delete(name)

    const request: MockIDBOpenDBRequest = {
      result: undefined as unknown as MockIDBDatabase,
      error: null,
      source: null,
      transaction: null,
      readyState: 'pending',
      onsuccess: null,
      onerror: null,
      onblocked: null,
      onupgradeneeded: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    }

    setTimeout(() => {
      request.readyState = 'done'
      if (request.onsuccess) {
        const event = new Event('success')
        Object.defineProperty(event, 'target', { value: request })
        request.onsuccess.call(request as unknown as IDBRequest<MockIDBDatabase>, event)
      }
    }, 0)

    return request
  })

  const mockDatabases = vi.fn(async () => {
    return Array.from(databases.entries()).map(([name, data]) => ({
      name,
      version: data.version,
    }))
  })

  const mockCmp = vi.fn((first: unknown, second: unknown) => {
    if (first === second) return 0
    if (first < second) return -1
    return 1
  })

  const mockIndexedDB: IDBFactory = {
    open: mockOpen as unknown as IDBFactory['open'],
    deleteDatabase: mockDeleteDatabase as unknown as IDBFactory['deleteDatabase'],
    databases: mockDatabases as unknown as IDBFactory['databases'],
    cmp: mockCmp as unknown as IDBFactory['cmp'],
  }

  // Save original and install mock
  const originalIndexedDB = globalThis.indexedDB

  Object.defineProperty(globalThis, 'indexedDB', {
    writable: true,
    configurable: true,
    value: mockIndexedDB,
  })

  const getDatabase = (name: string) => {
    const db = databases.get(name)
    return db?.stores
  }

  const getStore = (dbName: string, storeName: string) => {
    const db = databases.get(dbName)
    return db?.stores.get(storeName)
  }

  const seedDatabase = (schema: DatabaseSchema) => {
    const storeSchemas = new Map<
      string,
      {
        keyPath: string | string[] | null
        autoIncrement: boolean
        indexes: Map<string, { keyPath: string | string[]; unique: boolean; multiEntry: boolean }>
      }
    >()

    const stores = new Map<string, Map<IDBValidKey, unknown>>()

    for (const storeSchema of schema.stores) {
      const storeData = new Map<IDBValidKey, unknown>()

      const indexes = new Map<string, { keyPath: string | string[]; unique: boolean; multiEntry: boolean }>()
      if (storeSchema.indexes) {
        for (const indexSchema of storeSchema.indexes) {
          indexes.set(indexSchema.name, {
            keyPath: indexSchema.keyPath,
            unique: indexSchema.options?.unique ?? false,
            multiEntry: indexSchema.options?.multiEntry ?? false,
          })
        }
      }

      storeSchemas.set(storeSchema.name, {
        keyPath: storeSchema.keyPath ?? null,
        autoIncrement: storeSchema.autoIncrement ?? false,
        indexes,
      })

      if (storeSchema.data) {
        for (const item of storeSchema.data) {
          let key: IDBValidKey
          if (item.key !== undefined) {
            key = item.key
          } else if (storeSchema.autoIncrement) {
            key = getAutoIncrementKey(schema.name, storeSchema.name)
            if (typeof item.value === 'object' && item.value !== null && storeSchema.keyPath && typeof storeSchema.keyPath === 'string') {
              (item.value as Record<string, unknown>)[storeSchema.keyPath] = key
            }
          } else if (storeSchema.keyPath && typeof storeSchema.keyPath === 'string' && typeof item.value === 'object' && item.value !== null) {
            key = (item.value as Record<string, unknown>)[storeSchema.keyPath] as IDBValidKey
          } else {
            continue // Skip items without valid keys
          }
          storeData.set(key, item.value)
        }
      }

      stores.set(storeSchema.name, storeData)
    }

    databases.set(schema.name, {
      version: schema.version,
      stores,
      storeSchemas,
    })
  }

  const clearAllDatabases = () => {
    databases.clear()
    autoIncrementCounters.clear()
  }

  const getAllDatabases = () => {
    const result = new Map<string, { version: number; stores: Map<string, Map<IDBValidKey, unknown>> }>()
    for (const [name, data] of databases) {
      result.set(name, {
        version: data.version,
        stores: new Map(data.stores),
      })
    }
    return result
  }

  const cleanup = () => {
    // Restore original
    Object.defineProperty(globalThis, 'indexedDB', {
      writable: true,
      configurable: true,
      value: originalIndexedDB,
    })

    // Clear all mock data
    databases.clear()
    autoIncrementCounters.clear()

    // Clear mock call history
    mockOpen.mockClear()
    mockDeleteDatabase.mockClear()
    mockDatabases.mockClear()
    mockCmp.mockClear()
  }

  return {
    mockOpen,
    mockDeleteDatabase,
    mockDatabases,
    mockCmp,
    getDatabase,
    getStore,
    seedDatabase,
    clearAllDatabases,
    getAllDatabases,
    cleanup,
  }
}

/**
 * Common database schemas for testing
 */
export const DatabasePresets = {
  /**
   * Simple key-value store
   */
  keyValueStore: (name: string = 'kvStore'): DatabaseSchema => ({
    name,
    version: 1,
    stores: [
      {
        name: 'data',
        keyPath: 'key',
      },
    ],
  }),

  /**
   * User database with common fields
   */
  usersDatabase: (name: string = 'usersDb'): DatabaseSchema => ({
    name,
    version: 1,
    stores: [
      {
        name: 'users',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'email', keyPath: 'email', options: { unique: true } },
          { name: 'username', keyPath: 'username', options: { unique: true } },
        ],
      },
      {
        name: 'sessions',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'userId', keyPath: 'userId' },
          { name: 'expiresAt', keyPath: 'expiresAt' },
        ],
      },
    ],
  }),

  /**
   * Todo application database
   */
  todoDatabase: (name: string = 'todoDb'): DatabaseSchema => ({
    name,
    version: 1,
    stores: [
      {
        name: 'todos',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
          { name: 'completed', keyPath: 'completed' },
          { name: 'createdAt', keyPath: 'createdAt' },
          { name: 'priority', keyPath: 'priority' },
        ],
      },
      {
        name: 'categories',
        keyPath: 'id',
        autoIncrement: true,
      },
    ],
  }),

  /**
   * Offline-first cache database
   */
  cacheDatabase: (name: string = 'cacheDb'): DatabaseSchema => ({
    name,
    version: 1,
    stores: [
      {
        name: 'requests',
        keyPath: 'url',
        indexes: [
          { name: 'timestamp', keyPath: 'timestamp' },
          { name: 'method', keyPath: 'method' },
        ],
      },
      {
        name: 'responses',
        keyPath: 'url',
        indexes: [
          { name: 'expiresAt', keyPath: 'expiresAt' },
        ],
      },
    ],
  }),
} as const

/**
 * IndexedDB error codes for testing error scenarios
 */
export const IDBErrorCode = {
  UNKNOWN_ERROR: 0,
  CONSTRAINT_ERROR: 'ConstraintError',
  DATA_ERROR: 'DataError',
  TRANSACTION_INACTIVE_ERROR: 'TransactionInactiveError',
  READ_ONLY_ERROR: 'ReadOnlyError',
  VERSION_ERROR: 'VersionError',
  NOT_FOUND_ERROR: 'NotFoundError',
  INVALID_STATE_ERROR: 'InvalidStateError',
  INVALID_ACCESS_ERROR: 'InvalidAccessError',
  ABORT_ERROR: 'AbortError',
  TIMEOUT_ERROR: 'TimeoutError',
  QUOTA_EXCEEDED_ERROR: 'QuotaExceededError',
} as const
