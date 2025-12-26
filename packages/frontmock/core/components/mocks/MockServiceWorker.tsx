/**
 * MockServiceWorker - Mock Service Worker API for testing
 *
 * Allows testing PWA features, offline functionality, and service worker lifecycle
 * without actual service worker registration
 */

export type ServiceWorkerState =
  | 'parsed'
  | 'installing'
  | 'installed'
  | 'activating'
  | 'activated'
  | 'redundant'

export interface MockServiceWorker {
  scriptURL: string
  state: ServiceWorkerState
  postMessage: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  onstatechange: ((this: ServiceWorker, ev: Event) => void) | null
  onerror: ((this: AbstractWorker, ev: ErrorEvent) => void) | null
  dispatchEvent: (event: Event) => boolean
}

export interface MockServiceWorkerRegistration {
  active: MockServiceWorker | null
  installing: MockServiceWorker | null
  waiting: MockServiceWorker | null
  scope: string
  updateViaCache: ServiceWorkerUpdateViaCache
  navigationPreload: NavigationPreloadManager
  pushManager: PushManager
  sync?: SyncManager
  update: ReturnType<typeof vi.fn>
  unregister: ReturnType<typeof vi.fn>
  showNotification: ReturnType<typeof vi.fn>
  getNotifications: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  onupdatefound: ((this: ServiceWorkerRegistration, ev: Event) => void) | null
  dispatchEvent: (event: Event) => boolean
}

export interface MockServiceWorkerContainer {
  controller: MockServiceWorker | null
  ready: Promise<MockServiceWorkerRegistration>
  register: ReturnType<typeof vi.fn>
  getRegistration: ReturnType<typeof vi.fn>
  getRegistrations: ReturnType<typeof vi.fn>
  startMessages: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  oncontrollerchange: ((this: ServiceWorkerContainer, ev: Event) => void) | null
  onmessage: ((this: ServiceWorkerContainer, ev: MessageEvent) => void) | null
  onmessageerror: ((this: ServiceWorkerContainer, ev: MessageEvent) => void) | null
  dispatchEvent: (event: Event) => boolean
}

export interface MockServiceWorkerReturn {
  mockRegister: ReturnType<typeof vi.fn>
  mockGetRegistration: ReturnType<typeof vi.fn>
  mockGetRegistrations: ReturnType<typeof vi.fn>
  mockUpdate: ReturnType<typeof vi.fn>
  mockUnregister: ReturnType<typeof vi.fn>
  mockPostMessage: ReturnType<typeof vi.fn>
  getContainer: () => MockServiceWorkerContainer
  getRegistration: () => MockServiceWorkerRegistration | null
  getActiveWorker: () => MockServiceWorker | null
  getInstallingWorker: () => MockServiceWorker | null
  getWaitingWorker: () => MockServiceWorker | null
  createWorker: (scriptURL: string, state?: ServiceWorkerState) => MockServiceWorker
  setController: (worker: MockServiceWorker | null) => void
  simulateRegister: (scriptURL: string, options?: RegistrationOptions) => Promise<MockServiceWorkerRegistration>
  simulateStateChange: (worker: MockServiceWorker, newState: ServiceWorkerState) => void
  simulateUpdateFound: () => void
  simulateControllerChange: (worker: MockServiceWorker) => void
  simulateMessage: (data: unknown, source?: MockServiceWorker) => void
  simulateLifecycle: (scriptURL: string) => Promise<MockServiceWorkerRegistration>
  cleanup: () => void
}

/**
 * Sets up mock for Service Worker API
 *
 * @example
 * ```typescript
 * import { setupMockServiceWorker } from '@ux.qa/frontmock'
 *
 * const {
 *   mockRegister,
 *   simulateRegister,
 *   simulateLifecycle,
 *   cleanup
 * } = setupMockServiceWorker()
 *
 * render(<PWAInstallPrompt />)
 *
 * // Simulate service worker registration
 * const registration = await simulateRegister('/sw.js')
 *
 * // Or simulate full lifecycle (installing -> installed -> activating -> activated)
 * await simulateLifecycle('/sw.js')
 *
 * // Verify PWA prompt shows
 * expect(screen.getByText(/Install App/i)).toBeInTheDocument()
 *
 * cleanup()
 * ```
 *
 * @example
 * ```typescript
 * // Testing service worker updates
 * const { simulateRegister, simulateUpdateFound, getRegistration } = setupMockServiceWorker()
 *
 * await simulateRegister('/sw.js')
 *
 * render(<UpdateNotification />)
 *
 * // Simulate an update is found
 * simulateUpdateFound()
 *
 * expect(screen.getByText(/Update available/i)).toBeInTheDocument()
 * ```
 *
 * @example
 * ```typescript
 * // Testing message passing
 * const { simulateRegister, simulateMessage, mockPostMessage } = setupMockServiceWorker()
 *
 * await simulateRegister('/sw.js')
 *
 * render(<ServiceWorkerMessenger />)
 *
 * // Simulate receiving a message from the service worker
 * simulateMessage({ type: 'CACHE_UPDATED', payload: { version: '2.0' } })
 *
 * expect(screen.getByText(/Cache updated/i)).toBeInTheDocument()
 *
 * // Test sending a message to the service worker
 * fireEvent.click(screen.getByText('Sync Data'))
 * expect(mockPostMessage).toHaveBeenCalledWith({ type: 'SYNC_DATA' })
 * ```
 */
export function setupMockServiceWorker(): MockServiceWorkerReturn {
  const registrations = new Map<string, MockServiceWorkerRegistration>()
  const containerListeners = new Map<string, Set<EventListener>>()
  let currentController: MockServiceWorker | null = null
  let currentRegistration: MockServiceWorkerRegistration | null = null

  // Save original
  const originalServiceWorker = navigator.serviceWorker

  // Create a mock service worker instance
  const createWorker = (scriptURL: string, state: ServiceWorkerState = 'parsed'): MockServiceWorker => {
    const workerListeners = new Map<string, Set<EventListener>>()

    const worker: MockServiceWorker = {
      scriptURL,
      state,
      postMessage: vi.fn(),
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        if (!workerListeners.has(type)) {
          workerListeners.set(type, new Set())
        }
        workerListeners.get(type)!.add(listener)
      }),
      removeEventListener: vi.fn((type: string, listener: EventListener) => {
        workerListeners.get(type)?.delete(listener)
      }),
      onstatechange: null,
      onerror: null,
      dispatchEvent: (event: Event): boolean => {
        const listeners = workerListeners.get(event.type)
        if (listeners) {
          listeners.forEach((listener) => {
            if (typeof listener === 'function') {
              listener(event)
            }
          })
        }
        if (event.type === 'statechange' && worker.onstatechange) {
          worker.onstatechange.call(worker as unknown as ServiceWorker, event)
        }
        if (event.type === 'error' && worker.onerror) {
          worker.onerror.call(worker as unknown as AbstractWorker, event as ErrorEvent)
        }
        return true
      },
    }

    return worker
  }

  // Create a mock registration
  const createRegistration = (
    scriptURL: string,
    scope: string = '/'
  ): MockServiceWorkerRegistration => {
    const registrationListeners = new Map<string, Set<EventListener>>()

    const registration: MockServiceWorkerRegistration = {
      active: null,
      installing: null,
      waiting: null,
      scope,
      updateViaCache: 'imports' as ServiceWorkerUpdateViaCache,
      navigationPreload: {
        enable: vi.fn(() => Promise.resolve()),
        disable: vi.fn(() => Promise.resolve()),
        setHeaderValue: vi.fn(() => Promise.resolve()),
        getState: vi.fn(() => Promise.resolve({ enabled: false, headerValue: '' })),
      } as unknown as NavigationPreloadManager,
      pushManager: {
        subscribe: vi.fn(() => Promise.resolve(null)),
        getSubscription: vi.fn(() => Promise.resolve(null)),
        permissionState: vi.fn(() => Promise.resolve('prompt')),
      } as unknown as PushManager,
      update: vi.fn(() => Promise.resolve(registration)),
      unregister: vi.fn(() => {
        registrations.delete(scope)
        if (currentRegistration === registration) {
          currentRegistration = null
          currentController = null
        }
        return Promise.resolve(true)
      }),
      showNotification: vi.fn(() => Promise.resolve()),
      getNotifications: vi.fn(() => Promise.resolve([])),
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        if (!registrationListeners.has(type)) {
          registrationListeners.set(type, new Set())
        }
        registrationListeners.get(type)!.add(listener)
      }),
      removeEventListener: vi.fn((type: string, listener: EventListener) => {
        registrationListeners.get(type)?.delete(listener)
      }),
      onupdatefound: null,
      dispatchEvent: (event: Event): boolean => {
        const listeners = registrationListeners.get(event.type)
        if (listeners) {
          listeners.forEach((listener) => {
            if (typeof listener === 'function') {
              listener(event)
            }
          })
        }
        if (event.type === 'updatefound' && registration.onupdatefound) {
          registration.onupdatefound.call(
            registration as unknown as ServiceWorkerRegistration,
            event
          )
        }
        return true
      },
    }

    return registration
  }

  // Mock functions
  const mockRegister = vi.fn(
    (scriptURL: string, options?: RegistrationOptions): Promise<MockServiceWorkerRegistration> => {
      const scope = options?.scope ?? '/'
      const registration = createRegistration(scriptURL, scope)
      registrations.set(scope, registration)
      currentRegistration = registration
      return Promise.resolve(registration)
    }
  )

  const mockGetRegistration = vi.fn(
    (scope?: string): Promise<MockServiceWorkerRegistration | undefined> => {
      const key = scope ?? '/'
      return Promise.resolve(registrations.get(key))
    }
  )

  const mockGetRegistrations = vi.fn((): Promise<MockServiceWorkerRegistration[]> => {
    return Promise.resolve(Array.from(registrations.values()))
  })

  const mockUpdate = vi.fn((): Promise<MockServiceWorkerRegistration> => {
    if (currentRegistration) {
      return Promise.resolve(currentRegistration)
    }
    return Promise.reject(new Error('No registration found'))
  })

  const mockUnregister = vi.fn((): Promise<boolean> => {
    if (currentRegistration) {
      registrations.delete(currentRegistration.scope)
      currentRegistration = null
      currentController = null
      return Promise.resolve(true)
    }
    return Promise.resolve(false)
  })

  const mockPostMessage = vi.fn()

  const mockStartMessages = vi.fn()

  // Create mock container
  let readyResolve: (reg: MockServiceWorkerRegistration) => void
  const readyPromise = new Promise<MockServiceWorkerRegistration>((resolve) => {
    readyResolve = resolve
  })

  const mockContainer: MockServiceWorkerContainer = {
    get controller() {
      return currentController
    },
    ready: readyPromise,
    register: mockRegister,
    getRegistration: mockGetRegistration,
    getRegistrations: mockGetRegistrations,
    startMessages: mockStartMessages,
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      if (!containerListeners.has(type)) {
        containerListeners.set(type, new Set())
      }
      containerListeners.get(type)!.add(listener)
    }),
    removeEventListener: vi.fn((type: string, listener: EventListener) => {
      containerListeners.get(type)?.delete(listener)
    }),
    oncontrollerchange: null,
    onmessage: null,
    onmessageerror: null,
    dispatchEvent: (event: Event): boolean => {
      const listeners = containerListeners.get(event.type)
      if (listeners) {
        listeners.forEach((listener) => {
          if (typeof listener === 'function') {
            listener(event)
          }
        })
      }
      if (event.type === 'controllerchange' && mockContainer.oncontrollerchange) {
        mockContainer.oncontrollerchange.call(
          mockContainer as unknown as ServiceWorkerContainer,
          event
        )
      }
      if (event.type === 'message' && mockContainer.onmessage) {
        mockContainer.onmessage.call(
          mockContainer as unknown as ServiceWorkerContainer,
          event as MessageEvent
        )
      }
      if (event.type === 'messageerror' && mockContainer.onmessageerror) {
        mockContainer.onmessageerror.call(
          mockContainer as unknown as ServiceWorkerContainer,
          event as MessageEvent
        )
      }
      return true
    },
  }

  // Install mock
  Object.defineProperty(navigator, 'serviceWorker', {
    writable: true,
    configurable: true,
    value: mockContainer,
  })

  // Helper functions
  const setController = (worker: MockServiceWorker | null) => {
    currentController = worker
    if (worker) {
      worker.postMessage = mockPostMessage
    }
  }

  const simulateStateChange = (worker: MockServiceWorker, newState: ServiceWorkerState) => {
    ;(worker as { state: ServiceWorkerState }).state = newState
    const event = new Event('statechange')
    worker.dispatchEvent(event)
  }

  const simulateUpdateFound = () => {
    if (currentRegistration) {
      const event = new Event('updatefound')
      currentRegistration.dispatchEvent(event)
    }
  }

  const simulateControllerChange = (worker: MockServiceWorker) => {
    setController(worker)
    const event = new Event('controllerchange')
    mockContainer.dispatchEvent(event)
  }

  const simulateMessage = (data: unknown, source?: MockServiceWorker) => {
    const event = new MessageEvent('message', {
      data,
      source: source as unknown as MessageEventSource,
    })
    mockContainer.dispatchEvent(event)
  }

  const simulateRegister = async (
    scriptURL: string,
    options?: RegistrationOptions
  ): Promise<MockServiceWorkerRegistration> => {
    const registration = await mockRegister(scriptURL, options)
    const worker = createWorker(scriptURL, 'installing')
    registration.installing = worker
    return registration
  }

  const simulateLifecycle = async (
    scriptURL: string,
    options?: RegistrationOptions
  ): Promise<MockServiceWorkerRegistration> => {
    const registration = await simulateRegister(scriptURL, options)
    const worker = registration.installing!

    // installing -> installed
    await new Promise((resolve) => setTimeout(resolve, 0))
    simulateStateChange(worker, 'installed')
    registration.installing = null
    registration.waiting = worker

    // installed -> activating
    await new Promise((resolve) => setTimeout(resolve, 0))
    simulateStateChange(worker, 'activating')
    registration.waiting = null

    // activating -> activated
    await new Promise((resolve) => setTimeout(resolve, 0))
    simulateStateChange(worker, 'activated')
    registration.active = worker
    setController(worker)

    // Resolve ready promise
    readyResolve(registration)

    return registration
  }

  const cleanup = () => {
    // Restore original
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: originalServiceWorker,
    })

    registrations.clear()
    containerListeners.clear()
    currentController = null
    currentRegistration = null

    mockRegister.mockClear()
    mockGetRegistration.mockClear()
    mockGetRegistrations.mockClear()
    mockUpdate.mockClear()
    mockUnregister.mockClear()
    mockPostMessage.mockClear()
    mockStartMessages.mockClear()
  }

  return {
    mockRegister,
    mockGetRegistration,
    mockGetRegistrations,
    mockUpdate,
    mockUnregister,
    mockPostMessage,
    getContainer: () => mockContainer,
    getRegistration: () => currentRegistration,
    getActiveWorker: () => currentRegistration?.active ?? null,
    getInstallingWorker: () => currentRegistration?.installing ?? null,
    getWaitingWorker: () => currentRegistration?.waiting ?? null,
    createWorker,
    setController,
    simulateRegister,
    simulateStateChange,
    simulateUpdateFound,
    simulateControllerChange,
    simulateMessage,
    simulateLifecycle,
    cleanup,
  }
}

/**
 * Service Worker lifecycle states
 */
export const ServiceWorkerStateOrder = [
  'parsed',
  'installing',
  'installed',
  'activating',
  'activated',
  'redundant',
] as const

/**
 * Common service worker script paths for testing
 */
export const ServiceWorkerPaths = {
  default: '/sw.js',
  workbox: '/workbox-sw.js',
  firebase: '/firebase-messaging-sw.js',
  pwa: '/service-worker.js',
  offline: '/offline-sw.js',
} as const
