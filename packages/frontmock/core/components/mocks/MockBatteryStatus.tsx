/**
 * MockBatteryStatus - Mock Battery Status API for testing
 *
 * Allows testing battery-aware features without actual battery hardware
 */

export interface BatteryManager {
  charging: boolean
  chargingTime: number
  dischargingTime: number
  level: number
  addEventListener: (type: string, listener: EventListener) => void
  removeEventListener: (type: string, listener: EventListener) => void
  dispatchEvent: (event: Event) => boolean
}

export interface MockBatteryStatusReturn {
  mockGetBattery: ReturnType<typeof vi.fn>
  batteryManager: BatteryManager
  setBatteryLevel: (level: number) => void
  setCharging: (charging: boolean, chargingTime?: number) => void
  setDischargingTime: (time: number) => void
  triggerEvent: (eventType: 'chargingchange' | 'chargingtimechange' | 'dischargingtimechange' | 'levelchange') => void
  cleanup: () => void
}

/**
 * Sets up mock for Battery Status API (navigator.getBattery)
 *
 * @example
 * ```typescript
 * import { setupMockBatteryStatus, BatteryPresets } from '@ux.qa/frontmock'
 *
 * const { setBatteryLevel, setCharging, triggerEvent, cleanup } = setupMockBatteryStatus()
 *
 * render(<BatteryIndicator />)
 *
 * // Set low battery
 * setBatteryLevel(0.15)
 * triggerEvent('levelchange')
 *
 * // Verify low battery warning displayed
 * expect(screen.getByText(/Low Battery/i)).toBeInTheDocument()
 *
 * // Simulate plugging in charger
 * setCharging(true)
 * triggerEvent('chargingchange')
 *
 * // Verify charging indicator
 * expect(screen.getByText(/Charging/i)).toBeInTheDocument()
 *
 * cleanup()
 * ```
 *
 * @example
 * ```typescript
 * // Using presets
 * import { setupMockBatteryStatus, BatteryPresets } from '@ux.qa/frontmock'
 *
 * const { batteryManager, cleanup } = setupMockBatteryStatus(BatteryPresets.critical)
 *
 * expect(batteryManager.level).toBe(0.05)
 * expect(batteryManager.charging).toBe(false)
 *
 * cleanup()
 * ```
 */
export function setupMockBatteryStatus(
  initialState?: Partial<Pick<BatteryManager, 'charging' | 'chargingTime' | 'dischargingTime' | 'level'>>
): MockBatteryStatusReturn {
  const eventListeners = new Map<string, Set<EventListener>>()

  // Initialize battery state with defaults or provided values
  let batteryState = {
    charging: initialState?.charging ?? true,
    chargingTime: initialState?.chargingTime ?? 0,
    dischargingTime: initialState?.dischargingTime ?? Infinity,
    level: initialState?.level ?? 1,
  }

  const addEventListener = vi.fn((type: string, listener: EventListener) => {
    if (!eventListeners.has(type)) {
      eventListeners.set(type, new Set())
    }
    eventListeners.get(type)!.add(listener)
  })

  const removeEventListener = vi.fn((type: string, listener: EventListener) => {
    eventListeners.get(type)?.delete(listener)
  })

  const dispatchEvent = vi.fn((event: Event): boolean => {
    const listeners = eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach((listener) => {
        listener(event)
      })
    }
    return true
  })

  // Create a reactive battery manager object
  const batteryManager: BatteryManager = {
    get charging() {
      return batteryState.charging
    },
    get chargingTime() {
      return batteryState.chargingTime
    },
    get dischargingTime() {
      return batteryState.dischargingTime
    },
    get level() {
      return batteryState.level
    },
    addEventListener,
    removeEventListener,
    dispatchEvent,
  }

  const mockGetBattery = vi.fn((): Promise<BatteryManager> => {
    return Promise.resolve(batteryManager)
  })

  // Save original getBattery if it exists
  const originalGetBattery = (navigator as Navigator & { getBattery?: () => Promise<BatteryManager> }).getBattery

  // Install mock
  Object.defineProperty(navigator, 'getBattery', {
    writable: true,
    configurable: true,
    value: mockGetBattery,
  })

  const setBatteryLevel = (level: number) => {
    if (level < 0 || level > 1) {
      throw new Error('Battery level must be between 0 and 1')
    }
    batteryState.level = level

    // Update charging/discharging times based on level
    if (batteryState.charging) {
      // Estimate charging time based on remaining capacity
      batteryState.chargingTime = level >= 1 ? 0 : Math.round((1 - level) * 3600)
      batteryState.dischargingTime = Infinity
    } else {
      batteryState.chargingTime = Infinity
      // Estimate discharging time based on remaining capacity
      batteryState.dischargingTime = level <= 0 ? 0 : Math.round(level * 7200)
    }
  }

  const setCharging = (charging: boolean, chargingTime?: number) => {
    batteryState.charging = charging

    if (charging) {
      batteryState.chargingTime = chargingTime ?? (batteryState.level >= 1 ? 0 : Math.round((1 - batteryState.level) * 3600))
      batteryState.dischargingTime = Infinity
    } else {
      batteryState.chargingTime = Infinity
      batteryState.dischargingTime = Math.round(batteryState.level * 7200)
    }
  }

  const setDischargingTime = (time: number) => {
    batteryState.dischargingTime = time
  }

  const triggerEvent = (eventType: 'chargingchange' | 'chargingtimechange' | 'dischargingtimechange' | 'levelchange') => {
    const event = new Event(eventType)
    dispatchEvent(event)
  }

  const cleanup = () => {
    // Restore original getBattery
    if (originalGetBattery) {
      Object.defineProperty(navigator, 'getBattery', {
        writable: true,
        configurable: true,
        value: originalGetBattery,
      })
    } else {
      // Remove the property if it didn't exist originally
      delete (navigator as Navigator & { getBattery?: () => Promise<BatteryManager> }).getBattery
    }

    // Clear all event listeners
    eventListeners.clear()

    // Clear mock call history
    mockGetBattery.mockClear()
    addEventListener.mockClear()
    removeEventListener.mockClear()
    dispatchEvent.mockClear()
  }

  return {
    mockGetBattery,
    batteryManager,
    setBatteryLevel,
    setCharging,
    setDischargingTime,
    triggerEvent,
    cleanup,
  }
}

/**
 * Common battery state presets for testing
 */
export const BatteryPresets = {
  /** Full battery, plugged in */
  full: {
    charging: true,
    chargingTime: 0,
    dischargingTime: Infinity,
    level: 1,
  },
  /** Low battery (15%), not charging */
  low: {
    charging: false,
    chargingTime: Infinity,
    dischargingTime: 1080, // ~18 minutes
    level: 0.15,
  },
  /** Critical battery (5%), not charging */
  critical: {
    charging: false,
    chargingTime: Infinity,
    dischargingTime: 360, // ~6 minutes
    level: 0.05,
  },
  /** Charging at 50% */
  charging: {
    charging: true,
    chargingTime: 1800, // ~30 minutes to full
    dischargingTime: Infinity,
    level: 0.5,
  },
  /** Half battery, not charging */
  half: {
    charging: false,
    chargingTime: Infinity,
    dischargingTime: 3600, // ~1 hour
    level: 0.5,
  },
  /** Empty battery (0%), not charging */
  empty: {
    charging: false,
    chargingTime: Infinity,
    dischargingTime: 0,
    level: 0,
  },
} as const

/**
 * Battery event types
 */
export const BatteryEventType = {
  CHARGING_CHANGE: 'chargingchange',
  CHARGING_TIME_CHANGE: 'chargingtimechange',
  DISCHARGING_TIME_CHANGE: 'dischargingtimechange',
  LEVEL_CHANGE: 'levelchange',
} as const
