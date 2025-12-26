/**
 * MockNotification - Mock Notification API for testing
 *
 * Allows testing notification features without browser permissions
 */

export type NotificationPermission = 'default' | 'granted' | 'denied'

export interface MockNotificationOptions {
  body?: string
  icon?: string
  badge?: string
  tag?: string
  image?: string
  data?: unknown
  vibrate?: number | number[]
  renotify?: boolean
  requireInteraction?: boolean
  actions?: NotificationAction[]
  silent?: boolean
  timestamp?: number
  dir?: 'auto' | 'ltr' | 'rtl'
  lang?: string
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface MockNotificationInstance {
  title: string
  options: MockNotificationOptions
  onclick: ((event: Event) => void) | null
  onclose: ((event: Event) => void) | null
  onerror: ((event: Event) => void) | null
  onshow: ((event: Event) => void) | null
  close: () => void
}

export interface CreatedNotification {
  title: string
  options: MockNotificationOptions
  instance: MockNotificationInstance
  createdAt: number
}

export interface MockNotificationReturn {
  mockNotificationConstructor: ReturnType<typeof vi.fn>
  mockRequestPermission: ReturnType<typeof vi.fn>
  setPermission: (permission: NotificationPermission) => void
  getPermission: () => NotificationPermission
  grantPermission: () => void
  denyPermission: () => void
  resetPermission: () => void
  getNotifications: () => CreatedNotification[]
  getLastNotification: () => CreatedNotification | undefined
  clearNotifications: () => void
  triggerClick: (index?: number) => void
  triggerClose: (index?: number) => void
  triggerError: (index?: number) => void
  triggerShow: (index?: number) => void
  cleanup: () => void
}

/**
 * Sets up mock for Notification API
 *
 * @example
 * ```typescript
 * import { setupMockNotification } from '@ux.qa/frontmock'
 *
 * const {
 *   grantPermission,
 *   getNotifications,
 *   triggerClick,
 *   cleanup
 * } = setupMockNotification()
 *
 * // Grant permission for notifications
 * grantPermission()
 *
 * render(<NotificationComponent />)
 *
 * // Trigger action that creates notification
 * await userEvent.click(screen.getByRole('button', { name: /notify/i }))
 *
 * // Verify notification was created
 * const notifications = getNotifications()
 * expect(notifications).toHaveLength(1)
 * expect(notifications[0].title).toBe('New Message')
 * expect(notifications[0].options.body).toBe('You have a new message')
 *
 * // Simulate user clicking the notification
 * triggerClick()
 *
 * cleanup()
 * ```
 *
 * @example
 * ```typescript
 * // Testing permission request flow
 * const { mockRequestPermission, cleanup } = setupMockNotification()
 *
 * render(<PermissionRequestComponent />)
 *
 * await userEvent.click(screen.getByRole('button', { name: /enable notifications/i }))
 *
 * expect(mockRequestPermission).toHaveBeenCalled()
 *
 * cleanup()
 * ```
 *
 * @example
 * ```typescript
 * // Testing denied permission scenario
 * const { denyPermission, getPermission, cleanup } = setupMockNotification()
 *
 * denyPermission()
 *
 * expect(getPermission()).toBe('denied')
 * expect(Notification.permission).toBe('denied')
 *
 * cleanup()
 * ```
 */
export function setupMockNotification(
  initialPermission: NotificationPermission = 'default'
): MockNotificationReturn {
  let currentPermission: NotificationPermission = initialPermission
  const createdNotifications: CreatedNotification[] = []

  // Store original Notification if it exists
  const originalNotification = typeof Notification !== 'undefined' ? Notification : undefined

  // Create mock notification instances
  const createMockNotificationInstance = (
    title: string,
    options: MockNotificationOptions = {}
  ): MockNotificationInstance => {
    const instance: MockNotificationInstance = {
      title,
      options,
      onclick: null,
      onclose: null,
      onerror: null,
      onshow: null,
      close: vi.fn(() => {
        if (instance.onclose) {
          instance.onclose(new Event('close'))
        }
      }),
    }
    return instance
  }

  // Mock Notification constructor
  const mockNotificationConstructor = vi.fn(
    (title: string, options: MockNotificationOptions = {}) => {
      if (currentPermission !== 'granted') {
        throw new TypeError(
          'Failed to construct \'Notification\': Notification permission has not been granted.'
        )
      }

      const instance = createMockNotificationInstance(title, options)

      const notification: CreatedNotification = {
        title,
        options,
        instance,
        createdAt: Date.now(),
      }

      createdNotifications.push(notification)

      // Trigger show event asynchronously
      setTimeout(() => {
        if (instance.onshow) {
          instance.onshow(new Event('show'))
        }
      }, 0)

      return instance
    }
  )

  // Mock requestPermission
  const mockRequestPermission = vi.fn(
    (callback?: (permission: NotificationPermission) => void): Promise<NotificationPermission> => {
      // If permission is already decided, return it
      if (currentPermission !== 'default') {
        if (callback) callback(currentPermission)
        return Promise.resolve(currentPermission)
      }

      // Default behavior: grant permission when requested
      currentPermission = 'granted'
      if (callback) callback(currentPermission)
      return Promise.resolve(currentPermission)
    }
  )

  // Create mock Notification class
  const MockNotificationClass = Object.assign(mockNotificationConstructor, {
    permission: currentPermission,
    requestPermission: mockRequestPermission,
    maxActions: 2,
  })

  // Update permission getter to always return current value
  Object.defineProperty(MockNotificationClass, 'permission', {
    get: () => currentPermission,
    configurable: true,
  })

  // Install mock on global/window
  const globalObj = typeof window !== 'undefined' ? window : globalThis
  Object.defineProperty(globalObj, 'Notification', {
    writable: true,
    configurable: true,
    value: MockNotificationClass,
  })

  // Helper functions
  const setPermission = (permission: NotificationPermission) => {
    currentPermission = permission
  }

  const getPermission = (): NotificationPermission => {
    return currentPermission
  }

  const grantPermission = () => {
    currentPermission = 'granted'
  }

  const denyPermission = () => {
    currentPermission = 'denied'
  }

  const resetPermission = () => {
    currentPermission = 'default'
  }

  const getNotifications = (): CreatedNotification[] => {
    return [...createdNotifications]
  }

  const getLastNotification = (): CreatedNotification | undefined => {
    return createdNotifications[createdNotifications.length - 1]
  }

  const clearNotifications = () => {
    createdNotifications.length = 0
  }

  // Event trigger helpers
  const triggerEvent = (
    eventName: 'onclick' | 'onclose' | 'onerror' | 'onshow',
    index?: number
  ) => {
    const targetIndex = index ?? createdNotifications.length - 1
    const notification = createdNotifications[targetIndex]

    if (notification && notification.instance[eventName]) {
      const eventType = eventName.replace('on', '')
      notification.instance[eventName]!(new Event(eventType))
    }
  }

  const triggerClick = (index?: number) => triggerEvent('onclick', index)
  const triggerClose = (index?: number) => triggerEvent('onclose', index)
  const triggerError = (index?: number) => triggerEvent('onerror', index)
  const triggerShow = (index?: number) => triggerEvent('onshow', index)

  const cleanup = () => {
    // Restore original Notification
    const globalObj = typeof window !== 'undefined' ? window : globalThis

    if (originalNotification) {
      Object.defineProperty(globalObj, 'Notification', {
        writable: true,
        configurable: true,
        value: originalNotification,
      })
    } else {
      // Remove mock if there was no original
      delete (globalObj as Record<string, unknown>).Notification
    }

    // Clear tracked notifications
    createdNotifications.length = 0

    // Clear mock call history
    mockNotificationConstructor.mockClear()
    mockRequestPermission.mockClear()
  }

  return {
    mockNotificationConstructor,
    mockRequestPermission,
    setPermission,
    getPermission,
    grantPermission,
    denyPermission,
    resetPermission,
    getNotifications,
    getLastNotification,
    clearNotifications,
    triggerClick,
    triggerClose,
    triggerError,
    triggerShow,
    cleanup,
  }
}

/**
 * Common notification presets for testing
 */
export const NotificationPresets = {
  simple: {
    title: 'New Notification',
    options: {},
  },
  withBody: {
    title: 'New Message',
    options: {
      body: 'You have received a new message',
    },
  },
  withIcon: {
    title: 'App Update',
    options: {
      body: 'A new version is available',
      icon: '/icons/update.png',
    },
  },
  withActions: {
    title: 'Incoming Call',
    options: {
      body: 'John Doe is calling...',
      icon: '/icons/call.png',
      actions: [
        { action: 'accept', title: 'Accept' },
        { action: 'decline', title: 'Decline' },
      ],
      requireInteraction: true,
    },
  },
  silent: {
    title: 'Background Sync Complete',
    options: {
      body: 'Your data has been synchronized',
      silent: true,
    },
  },
  urgent: {
    title: 'Security Alert',
    options: {
      body: 'Unusual login attempt detected',
      icon: '/icons/warning.png',
      requireInteraction: true,
      tag: 'security-alert',
    },
  },
} as const

/**
 * Notification permission states
 */
export const NotificationPermissionState = {
  DEFAULT: 'default' as NotificationPermission,
  GRANTED: 'granted' as NotificationPermission,
  DENIED: 'denied' as NotificationPermission,
} as const
