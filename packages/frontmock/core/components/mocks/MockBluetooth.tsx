/**
 * MockBluetooth - Mock Web Bluetooth API for testing
 *
 * Allows testing Bluetooth-based features without actual hardware
 */

export interface MockBluetoothDevice {
  id: string
  name: string
  gatt?: MockBluetoothRemoteGATTServer
  watchingAdvertisements: boolean
}

export interface MockBluetoothRemoteGATTServer {
  device: MockBluetoothDevice
  connected: boolean
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  getPrimaryService: ReturnType<typeof vi.fn>
  getPrimaryServices: ReturnType<typeof vi.fn>
}

export interface MockBluetoothRemoteGATTService {
  device: MockBluetoothDevice
  uuid: string
  isPrimary: boolean
  getCharacteristic: ReturnType<typeof vi.fn>
  getCharacteristics: ReturnType<typeof vi.fn>
}

export interface MockBluetoothRemoteGATTCharacteristic {
  service: MockBluetoothRemoteGATTService
  uuid: string
  properties: BluetoothCharacteristicProperties
  value: DataView | null
  readValue: ReturnType<typeof vi.fn>
  writeValue: ReturnType<typeof vi.fn>
  writeValueWithResponse: ReturnType<typeof vi.fn>
  writeValueWithoutResponse: ReturnType<typeof vi.fn>
  startNotifications: ReturnType<typeof vi.fn>
  stopNotifications: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
}

export interface BluetoothCharacteristicProperties {
  broadcast: boolean
  read: boolean
  writeWithoutResponse: boolean
  write: boolean
  notify: boolean
  indicate: boolean
  authenticatedSignedWrites: boolean
  reliableWrite: boolean
  writableAuxiliaries: boolean
}

export interface DeviceConfig {
  id: string
  name: string
  services?: ServiceConfig[]
}

export interface ServiceConfig {
  uuid: string
  isPrimary?: boolean
  characteristics?: CharacteristicConfig[]
}

export interface CharacteristicConfig {
  uuid: string
  properties?: Partial<BluetoothCharacteristicProperties>
  value?: ArrayBuffer | DataView
}

export interface MockBluetoothReturn {
  mockRequestDevice: ReturnType<typeof vi.fn>
  mockGetAvailability: ReturnType<typeof vi.fn>
  mockGetDevices: ReturnType<typeof vi.fn>
  addDevice: (config: DeviceConfig) => MockBluetoothDevice
  removeDevice: (deviceId: string) => void
  getDevices: () => MockBluetoothDevice[]
  simulateConnect: (deviceId: string) => void
  simulateDisconnect: (deviceId: string) => void
  setAvailability: (available: boolean) => void
  cleanup: () => void
}

/**
 * Sets up mock for Web Bluetooth API
 *
 * @example
 * ```typescript
 * import { setupMockBluetooth, BluetoothDevicePresets } from '@ux.qa/frontmock'
 *
 * const {
 *   addDevice,
 *   simulateConnect,
 *   simulateDisconnect,
 *   cleanup
 * } = setupMockBluetooth()
 *
 * // Add a heart rate monitor device
 * const device = addDevice(BluetoothDevicePresets.heartRateMonitor)
 *
 * render(<BluetoothDeviceSelector />)
 *
 * // Click connect button
 * await userEvent.click(screen.getByText('Connect Device'))
 *
 * // Simulate successful connection
 * simulateConnect(device.id)
 *
 * // Verify connected state
 * expect(screen.getByText(/Connected/i)).toBeInTheDocument()
 *
 * // Test disconnection
 * simulateDisconnect(device.id)
 * expect(screen.getByText(/Disconnected/i)).toBeInTheDocument()
 *
 * cleanup()
 * ```
 */
export function setupMockBluetooth(): MockBluetoothReturn {
  const devices = new Map<string, MockBluetoothDevice>()
  let isAvailable = true
  const eventListeners = new Map<string, Map<string, Set<EventListener>>>()

  // Save original bluetooth
  const originalBluetooth = navigator.bluetooth

  const createDefaultProperties = (): BluetoothCharacteristicProperties => ({
    broadcast: false,
    read: true,
    writeWithoutResponse: false,
    write: true,
    notify: true,
    indicate: false,
    authenticatedSignedWrites: false,
    reliableWrite: false,
    writableAuxiliaries: false,
  })

  const createCharacteristic = (
    service: MockBluetoothRemoteGATTService,
    config: CharacteristicConfig
  ): MockBluetoothRemoteGATTCharacteristic => {
    const characteristicListeners = new Map<string, Set<EventListener>>()
    let currentValue: DataView | null = config.value
      ? config.value instanceof DataView
        ? config.value
        : new DataView(config.value)
      : null

    const characteristic: MockBluetoothRemoteGATTCharacteristic = {
      service,
      uuid: config.uuid,
      properties: { ...createDefaultProperties(), ...config.properties },
      value: currentValue,
      readValue: vi.fn(() => {
        return Promise.resolve(currentValue)
      }),
      writeValue: vi.fn((value: BufferSource) => {
        currentValue = value instanceof DataView ? value : new DataView(value as ArrayBuffer)
        characteristic.value = currentValue
        return Promise.resolve()
      }),
      writeValueWithResponse: vi.fn((value: BufferSource) => {
        currentValue = value instanceof DataView ? value : new DataView(value as ArrayBuffer)
        characteristic.value = currentValue
        return Promise.resolve()
      }),
      writeValueWithoutResponse: vi.fn((value: BufferSource) => {
        currentValue = value instanceof DataView ? value : new DataView(value as ArrayBuffer)
        characteristic.value = currentValue
        return Promise.resolve()
      }),
      startNotifications: vi.fn(() => {
        return Promise.resolve(characteristic)
      }),
      stopNotifications: vi.fn(() => {
        return Promise.resolve(characteristic)
      }),
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        if (!characteristicListeners.has(type)) {
          characteristicListeners.set(type, new Set())
        }
        characteristicListeners.get(type)!.add(listener)
      }),
      removeEventListener: vi.fn((type: string, listener: EventListener) => {
        characteristicListeners.get(type)?.delete(listener)
      }),
    }

    return characteristic
  }

  const createService = (
    device: MockBluetoothDevice,
    config: ServiceConfig
  ): MockBluetoothRemoteGATTService => {
    const characteristics = new Map<string, MockBluetoothRemoteGATTCharacteristic>()

    const service: MockBluetoothRemoteGATTService = {
      device,
      uuid: config.uuid,
      isPrimary: config.isPrimary ?? true,
      getCharacteristic: vi.fn((uuid: string) => {
        const char = characteristics.get(uuid)
        if (char) {
          return Promise.resolve(char)
        }
        return Promise.reject(new DOMException('Characteristic not found', 'NotFoundError'))
      }),
      getCharacteristics: vi.fn((uuid?: string) => {
        if (uuid) {
          const char = characteristics.get(uuid)
          return Promise.resolve(char ? [char] : [])
        }
        return Promise.resolve(Array.from(characteristics.values()))
      }),
    }

    // Create characteristics for this service
    if (config.characteristics) {
      for (const charConfig of config.characteristics) {
        const characteristic = createCharacteristic(service, charConfig)
        characteristics.set(charConfig.uuid, characteristic)
      }
    }

    return service
  }

  const createGATTServer = (device: MockBluetoothDevice, services: ServiceConfig[]): MockBluetoothRemoteGATTServer => {
    const serviceMap = new Map<string, MockBluetoothRemoteGATTService>()

    const server: MockBluetoothRemoteGATTServer = {
      device,
      connected: false,
      connect: vi.fn(() => {
        server.connected = true
        return Promise.resolve(server)
      }),
      disconnect: vi.fn(() => {
        server.connected = false
        // Trigger gattserverdisconnected event
        const deviceListeners = eventListeners.get(device.id)
        if (deviceListeners) {
          const disconnectListeners = deviceListeners.get('gattserverdisconnected')
          if (disconnectListeners) {
            const event = new Event('gattserverdisconnected')
            disconnectListeners.forEach((listener) => listener(event))
          }
        }
      }),
      getPrimaryService: vi.fn((uuid: string) => {
        const service = serviceMap.get(uuid)
        if (service) {
          return Promise.resolve(service)
        }
        return Promise.reject(new DOMException('Service not found', 'NotFoundError'))
      }),
      getPrimaryServices: vi.fn((uuid?: string) => {
        if (uuid) {
          const service = serviceMap.get(uuid)
          return Promise.resolve(service ? [service] : [])
        }
        return Promise.resolve(Array.from(serviceMap.values()).filter((s) => s.isPrimary))
      }),
    }

    // Create services
    for (const serviceConfig of services) {
      const service = createService(device, serviceConfig)
      serviceMap.set(serviceConfig.uuid, service)
    }

    return server
  }

  const addDevice = (config: DeviceConfig): MockBluetoothDevice => {
    const device: MockBluetoothDevice = {
      id: config.id,
      name: config.name,
      watchingAdvertisements: false,
    }

    // Initialize event listeners for this device
    eventListeners.set(device.id, new Map())

    // Create GATT server if services are provided
    if (config.services && config.services.length > 0) {
      device.gatt = createGATTServer(device, config.services)
    } else {
      // Create empty GATT server
      device.gatt = createGATTServer(device, [])
    }

    // Add addEventListener and removeEventListener to device
    const deviceWithEvents = device as MockBluetoothDevice & {
      addEventListener: ReturnType<typeof vi.fn>
      removeEventListener: ReturnType<typeof vi.fn>
      watchAdvertisements: ReturnType<typeof vi.fn>
    }

    deviceWithEvents.addEventListener = vi.fn((type: string, listener: EventListener) => {
      const deviceListeners = eventListeners.get(device.id)!
      if (!deviceListeners.has(type)) {
        deviceListeners.set(type, new Set())
      }
      deviceListeners.get(type)!.add(listener)
    })

    deviceWithEvents.removeEventListener = vi.fn((type: string, listener: EventListener) => {
      const deviceListeners = eventListeners.get(device.id)
      deviceListeners?.get(type)?.delete(listener)
    })

    deviceWithEvents.watchAdvertisements = vi.fn(() => {
      device.watchingAdvertisements = true
      return Promise.resolve()
    })

    devices.set(config.id, deviceWithEvents as MockBluetoothDevice)
    return deviceWithEvents as MockBluetoothDevice
  }

  const removeDevice = (deviceId: string): void => {
    devices.delete(deviceId)
    eventListeners.delete(deviceId)
  }

  const getDevices = (): MockBluetoothDevice[] => {
    return Array.from(devices.values())
  }

  const simulateConnect = (deviceId: string): void => {
    const device = devices.get(deviceId)
    if (device?.gatt) {
      device.gatt.connected = true
    }
  }

  const simulateDisconnect = (deviceId: string): void => {
    const device = devices.get(deviceId)
    if (device?.gatt) {
      device.gatt.connected = false
      // Trigger gattserverdisconnected event
      const deviceListeners = eventListeners.get(deviceId)
      if (deviceListeners) {
        const disconnectListeners = deviceListeners.get('gattserverdisconnected')
        if (disconnectListeners) {
          const event = new Event('gattserverdisconnected')
          disconnectListeners.forEach((listener) => listener(event))
        }
      }
    }
  }

  const setAvailability = (available: boolean): void => {
    isAvailable = available
  }

  const mockRequestDevice = vi.fn(
    (options?: RequestDeviceOptions): Promise<MockBluetoothDevice> => {
      if (!isAvailable) {
        return Promise.reject(new DOMException('Bluetooth not available', 'NotFoundError'))
      }

      const availableDevices = Array.from(devices.values())

      if (availableDevices.length === 0) {
        return Promise.reject(new DOMException('No devices found', 'NotFoundError'))
      }

      // Filter by services if specified
      if (options?.filters) {
        const filtered = availableDevices.filter((device) => {
          return options.filters!.some((filter) => {
            if (filter.name && device.name !== filter.name) return false
            if (filter.namePrefix && !device.name.startsWith(filter.namePrefix)) return false
            // Service filtering would require checking device.gatt services
            return true
          })
        })

        if (filtered.length > 0) {
          return Promise.resolve(filtered[0])
        }
      }

      // Return first device if no filters or no matches
      return Promise.resolve(availableDevices[0])
    }
  )

  const mockGetAvailability = vi.fn((): Promise<boolean> => {
    return Promise.resolve(isAvailable)
  })

  const mockGetDevices = vi.fn((): Promise<MockBluetoothDevice[]> => {
    return Promise.resolve(Array.from(devices.values()))
  })

  // Create mock Bluetooth object
  const mockBluetooth = {
    requestDevice: mockRequestDevice,
    getAvailability: mockGetAvailability,
    getDevices: mockGetDevices,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  }

  // Install mock
  Object.defineProperty(navigator, 'bluetooth', {
    writable: true,
    configurable: true,
    value: mockBluetooth,
  })

  const cleanup = (): void => {
    // Restore original
    if (originalBluetooth !== undefined) {
      Object.defineProperty(navigator, 'bluetooth', {
        writable: true,
        configurable: true,
        value: originalBluetooth,
      })
    } else {
      // If bluetooth wasn't originally defined, remove it
      delete (navigator as { bluetooth?: unknown }).bluetooth
    }

    // Clear all devices and listeners
    devices.clear()
    eventListeners.clear()

    // Clear mock call history
    mockRequestDevice.mockClear()
    mockGetAvailability.mockClear()
    mockGetDevices.mockClear()
  }

  return {
    mockRequestDevice,
    mockGetAvailability,
    mockGetDevices,
    addDevice,
    removeDevice,
    getDevices,
    simulateConnect,
    simulateDisconnect,
    setAvailability,
    cleanup,
  }
}

/**
 * Standard Bluetooth GATT Service UUIDs
 */
export const BluetoothServiceUUID = {
  heartRate: '0000180d-0000-1000-8000-00805f9b34fb',
  batteryService: '0000180f-0000-1000-8000-00805f9b34fb',
  deviceInformation: '0000180a-0000-1000-8000-00805f9b34fb',
  genericAccess: '00001800-0000-1000-8000-00805f9b34fb',
  genericAttribute: '00001801-0000-1000-8000-00805f9b34fb',
  glucoseService: '00001808-0000-1000-8000-00805f9b34fb',
  healthThermometer: '00001809-0000-1000-8000-00805f9b34fb',
  bloodPressure: '00001810-0000-1000-8000-00805f9b34fb',
  runningSpeedAndCadence: '00001814-0000-1000-8000-00805f9b34fb',
  cyclingSpeedAndCadence: '00001816-0000-1000-8000-00805f9b34fb',
  cyclingPower: '00001818-0000-1000-8000-00805f9b34fb',
  fitnessMachine: '00001826-0000-1000-8000-00805f9b34fb',
} as const

/**
 * Standard Bluetooth GATT Characteristic UUIDs
 */
export const BluetoothCharacteristicUUID = {
  heartRateMeasurement: '00002a37-0000-1000-8000-00805f9b34fb',
  bodySensorLocation: '00002a38-0000-1000-8000-00805f9b34fb',
  heartRateControlPoint: '00002a39-0000-1000-8000-00805f9b34fb',
  batteryLevel: '00002a19-0000-1000-8000-00805f9b34fb',
  manufacturerName: '00002a29-0000-1000-8000-00805f9b34fb',
  modelNumber: '00002a24-0000-1000-8000-00805f9b34fb',
  serialNumber: '00002a25-0000-1000-8000-00805f9b34fb',
  firmwareRevision: '00002a26-0000-1000-8000-00805f9b34fb',
  softwareRevision: '00002a28-0000-1000-8000-00805f9b34fb',
} as const

/**
 * Common Bluetooth device presets for testing
 */
export const BluetoothDevicePresets = {
  heartRateMonitor: {
    id: 'heart-rate-monitor-001',
    name: 'Heart Rate Monitor',
    services: [
      {
        uuid: BluetoothServiceUUID.heartRate,
        isPrimary: true,
        characteristics: [
          {
            uuid: BluetoothCharacteristicUUID.heartRateMeasurement,
            properties: { read: true, notify: true },
            value: new Uint8Array([0x00, 72]).buffer, // 72 BPM
          },
          {
            uuid: BluetoothCharacteristicUUID.bodySensorLocation,
            properties: { read: true },
            value: new Uint8Array([0x01]).buffer, // Chest
          },
        ],
      },
      {
        uuid: BluetoothServiceUUID.batteryService,
        isPrimary: true,
        characteristics: [
          {
            uuid: BluetoothCharacteristicUUID.batteryLevel,
            properties: { read: true, notify: true },
            value: new Uint8Array([85]).buffer, // 85%
          },
        ],
      },
      {
        uuid: BluetoothServiceUUID.deviceInformation,
        isPrimary: true,
        characteristics: [
          {
            uuid: BluetoothCharacteristicUUID.manufacturerName,
            properties: { read: true },
          },
          {
            uuid: BluetoothCharacteristicUUID.modelNumber,
            properties: { read: true },
          },
        ],
      },
    ],
  },

  fitnessTracker: {
    id: 'fitness-tracker-001',
    name: 'Fitness Tracker Pro',
    services: [
      {
        uuid: BluetoothServiceUUID.heartRate,
        isPrimary: true,
        characteristics: [
          {
            uuid: BluetoothCharacteristicUUID.heartRateMeasurement,
            properties: { read: true, notify: true },
            value: new Uint8Array([0x00, 68]).buffer, // 68 BPM
          },
        ],
      },
      {
        uuid: BluetoothServiceUUID.runningSpeedAndCadence,
        isPrimary: true,
        characteristics: [],
      },
      {
        uuid: BluetoothServiceUUID.batteryService,
        isPrimary: true,
        characteristics: [
          {
            uuid: BluetoothCharacteristicUUID.batteryLevel,
            properties: { read: true, notify: true },
            value: new Uint8Array([60]).buffer, // 60%
          },
        ],
      },
    ],
  },

  cyclingSpeedSensor: {
    id: 'cycling-speed-001',
    name: 'Cycling Speed Sensor',
    services: [
      {
        uuid: BluetoothServiceUUID.cyclingSpeedAndCadence,
        isPrimary: true,
        characteristics: [],
      },
      {
        uuid: BluetoothServiceUUID.batteryService,
        isPrimary: true,
        characteristics: [
          {
            uuid: BluetoothCharacteristicUUID.batteryLevel,
            properties: { read: true },
            value: new Uint8Array([100]).buffer, // 100%
          },
        ],
      },
    ],
  },

  cyclingPowerMeter: {
    id: 'cycling-power-001',
    name: 'Power Meter',
    services: [
      {
        uuid: BluetoothServiceUUID.cyclingPower,
        isPrimary: true,
        characteristics: [],
      },
      {
        uuid: BluetoothServiceUUID.batteryService,
        isPrimary: true,
        characteristics: [
          {
            uuid: BluetoothCharacteristicUUID.batteryLevel,
            properties: { read: true },
            value: new Uint8Array([75]).buffer, // 75%
          },
        ],
      },
    ],
  },

  bloodPressureMonitor: {
    id: 'blood-pressure-001',
    name: 'Blood Pressure Monitor',
    services: [
      {
        uuid: BluetoothServiceUUID.bloodPressure,
        isPrimary: true,
        characteristics: [],
      },
      {
        uuid: BluetoothServiceUUID.batteryService,
        isPrimary: true,
        characteristics: [
          {
            uuid: BluetoothCharacteristicUUID.batteryLevel,
            properties: { read: true },
            value: new Uint8Array([50]).buffer, // 50%
          },
        ],
      },
    ],
  },

  glucoseMonitor: {
    id: 'glucose-monitor-001',
    name: 'Glucose Monitor',
    services: [
      {
        uuid: BluetoothServiceUUID.glucoseService,
        isPrimary: true,
        characteristics: [],
      },
      {
        uuid: BluetoothServiceUUID.deviceInformation,
        isPrimary: true,
        characteristics: [
          {
            uuid: BluetoothCharacteristicUUID.manufacturerName,
            properties: { read: true },
          },
        ],
      },
    ],
  },

  thermometer: {
    id: 'thermometer-001',
    name: 'Health Thermometer',
    services: [
      {
        uuid: BluetoothServiceUUID.healthThermometer,
        isPrimary: true,
        characteristics: [],
      },
      {
        uuid: BluetoothServiceUUID.batteryService,
        isPrimary: true,
        characteristics: [
          {
            uuid: BluetoothCharacteristicUUID.batteryLevel,
            properties: { read: true },
            value: new Uint8Array([90]).buffer, // 90%
          },
        ],
      },
    ],
  },

  fitnessMachine: {
    id: 'fitness-machine-001',
    name: 'Smart Treadmill',
    services: [
      {
        uuid: BluetoothServiceUUID.fitnessMachine,
        isPrimary: true,
        characteristics: [],
      },
      {
        uuid: BluetoothServiceUUID.heartRate,
        isPrimary: false,
        characteristics: [
          {
            uuid: BluetoothCharacteristicUUID.heartRateMeasurement,
            properties: { read: true, notify: true },
          },
        ],
      },
    ],
  },
} as const

/**
 * Bluetooth error types for testing error scenarios
 */
export const BluetoothErrorType = {
  NotFoundError: 'NotFoundError',
  SecurityError: 'SecurityError',
  NetworkError: 'NetworkError',
  NotSupportedError: 'NotSupportedError',
  AbortError: 'AbortError',
} as const
