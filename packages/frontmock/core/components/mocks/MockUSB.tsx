/**
 * MockUSB - Mock WebUSB API for testing
 *
 * Allows testing USB device interactions without actual hardware
 */

export interface MockUSBDeviceConfig {
  vendorId: number
  productId: number
  deviceClass?: number
  deviceSubclass?: number
  deviceProtocol?: number
  deviceVersionMajor?: number
  deviceVersionMinor?: number
  deviceVersionSubminor?: number
  manufacturerName?: string
  productName?: string
  serialNumber?: string
  configurations?: USBConfiguration[]
}

export interface MockUSBTransferResult {
  status: USBTransferStatus
  data?: DataView
}

export interface MockUSBDevice {
  readonly vendorId: number
  readonly productId: number
  readonly deviceClass: number
  readonly deviceSubclass: number
  readonly deviceProtocol: number
  readonly deviceVersionMajor: number
  readonly deviceVersionMinor: number
  readonly deviceVersionSubminor: number
  readonly manufacturerName: string | undefined
  readonly productName: string | undefined
  readonly serialNumber: string | undefined
  readonly configuration: USBConfiguration | null
  readonly configurations: USBConfiguration[]
  readonly opened: boolean
  open: () => Promise<void>
  close: () => Promise<void>
  forget: () => Promise<void>
  selectConfiguration: (configurationValue: number) => Promise<void>
  claimInterface: (interfaceNumber: number) => Promise<void>
  releaseInterface: (interfaceNumber: number) => Promise<void>
  selectAlternateInterface: (interfaceNumber: number, alternateSetting: number) => Promise<void>
  controlTransferIn: (setup: USBControlTransferParameters, length: number) => Promise<USBInTransferResult>
  controlTransferOut: (setup: USBControlTransferParameters, data?: BufferSource) => Promise<USBOutTransferResult>
  clearHalt: (direction: USBDirection, endpointNumber: number) => Promise<void>
  transferIn: (endpointNumber: number, length: number) => Promise<USBInTransferResult>
  transferOut: (endpointNumber: number, data: BufferSource) => Promise<USBOutTransferResult>
  isochronousTransferIn: (endpointNumber: number, packetLengths: number[]) => Promise<USBIsochronousInTransferResult>
  isochronousTransferOut: (endpointNumber: number, data: BufferSource, packetLengths: number[]) => Promise<USBIsochronousOutTransferResult>
  reset: () => Promise<void>
}

export interface MockUSBReturn {
  mockRequestDevice: ReturnType<typeof vi.fn>
  mockGetDevices: ReturnType<typeof vi.fn>
  addDevice: (config: MockUSBDeviceConfig) => MockUSBDevice
  removeDevice: (device: MockUSBDevice) => void
  getAvailableDevices: () => MockUSBDevice[]
  getConnectedDevices: () => MockUSBDevice[]
  simulateConnect: (device: MockUSBDevice) => void
  simulateDisconnect: (device: MockUSBDevice) => void
  setTransferInResponse: (endpointNumber: number, data: Uint8Array) => void
  setTransferOutHandler: (endpointNumber: number, handler: (data: BufferSource) => void) => void
  cleanup: () => void
}

/**
 * Creates a mock USB device with the given configuration
 */
function createMockUSBDevice(config: MockUSBDeviceConfig): MockUSBDevice {
  let isOpened = false
  let currentConfiguration: USBConfiguration | null = null
  const claimedInterfaces = new Set<number>()

  const device: MockUSBDevice = {
    get vendorId() {
      return config.vendorId
    },
    get productId() {
      return config.productId
    },
    get deviceClass() {
      return config.deviceClass ?? 0
    },
    get deviceSubclass() {
      return config.deviceSubclass ?? 0
    },
    get deviceProtocol() {
      return config.deviceProtocol ?? 0
    },
    get deviceVersionMajor() {
      return config.deviceVersionMajor ?? 1
    },
    get deviceVersionMinor() {
      return config.deviceVersionMinor ?? 0
    },
    get deviceVersionSubminor() {
      return config.deviceVersionSubminor ?? 0
    },
    get manufacturerName() {
      return config.manufacturerName
    },
    get productName() {
      return config.productName
    },
    get serialNumber() {
      return config.serialNumber
    },
    get configuration() {
      return currentConfiguration
    },
    get configurations() {
      return config.configurations ?? []
    },
    get opened() {
      return isOpened
    },

    async open() {
      if (isOpened) {
        throw new DOMException('Device is already open', 'InvalidStateError')
      }
      isOpened = true
    },

    async close() {
      if (!isOpened) {
        throw new DOMException('Device is not open', 'InvalidStateError')
      }
      isOpened = false
      claimedInterfaces.clear()
      currentConfiguration = null
    },

    async forget() {
      if (isOpened) {
        await device.close()
      }
    },

    async selectConfiguration(configurationValue: number) {
      if (!isOpened) {
        throw new DOMException('Device is not open', 'InvalidStateError')
      }
      const cfg = config.configurations?.find(
        (c) => c.configurationValue === configurationValue
      )
      if (!cfg) {
        throw new DOMException('Configuration not found', 'NotFoundError')
      }
      currentConfiguration = cfg
    },

    async claimInterface(interfaceNumber: number) {
      if (!isOpened) {
        throw new DOMException('Device is not open', 'InvalidStateError')
      }
      if (!currentConfiguration) {
        throw new DOMException('No configuration selected', 'InvalidStateError')
      }
      if (claimedInterfaces.has(interfaceNumber)) {
        throw new DOMException('Interface already claimed', 'InvalidStateError')
      }
      claimedInterfaces.add(interfaceNumber)
    },

    async releaseInterface(interfaceNumber: number) {
      if (!isOpened) {
        throw new DOMException('Device is not open', 'InvalidStateError')
      }
      if (!claimedInterfaces.has(interfaceNumber)) {
        throw new DOMException('Interface not claimed', 'InvalidStateError')
      }
      claimedInterfaces.delete(interfaceNumber)
    },

    async selectAlternateInterface(interfaceNumber: number, alternateSetting: number) {
      if (!isOpened) {
        throw new DOMException('Device is not open', 'InvalidStateError')
      }
      if (!claimedInterfaces.has(interfaceNumber)) {
        throw new DOMException('Interface not claimed', 'InvalidStateError')
      }
    },

    async controlTransferIn(setup: USBControlTransferParameters, length: number): Promise<USBInTransferResult> {
      if (!isOpened) {
        throw new DOMException('Device is not open', 'InvalidStateError')
      }
      return {
        status: 'ok',
        data: new DataView(new ArrayBuffer(length)),
      }
    },

    async controlTransferOut(setup: USBControlTransferParameters, data?: BufferSource): Promise<USBOutTransferResult> {
      if (!isOpened) {
        throw new DOMException('Device is not open', 'InvalidStateError')
      }
      return {
        status: 'ok',
        bytesWritten: data ? (data instanceof ArrayBuffer ? data.byteLength : data.byteLength) : 0,
      }
    },

    async clearHalt(direction: USBDirection, endpointNumber: number) {
      if (!isOpened) {
        throw new DOMException('Device is not open', 'InvalidStateError')
      }
    },

    async transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult> {
      if (!isOpened) {
        throw new DOMException('Device is not open', 'InvalidStateError')
      }
      return {
        status: 'ok',
        data: new DataView(new ArrayBuffer(length)),
      }
    },

    async transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult> {
      if (!isOpened) {
        throw new DOMException('Device is not open', 'InvalidStateError')
      }
      return {
        status: 'ok',
        bytesWritten: data instanceof ArrayBuffer ? data.byteLength : data.byteLength,
      }
    },

    async isochronousTransferIn(endpointNumber: number, packetLengths: number[]): Promise<USBIsochronousInTransferResult> {
      if (!isOpened) {
        throw new DOMException('Device is not open', 'InvalidStateError')
      }
      const totalLength = packetLengths.reduce((a, b) => a + b, 0)
      return {
        data: new DataView(new ArrayBuffer(totalLength)),
        packets: packetLengths.map((length, index) => ({
          status: 'ok' as USBTransferStatus,
          data: new DataView(new ArrayBuffer(length)),
          bytesTransferred: length,
        })),
      }
    },

    async isochronousTransferOut(endpointNumber: number, data: BufferSource, packetLengths: number[]): Promise<USBIsochronousOutTransferResult> {
      if (!isOpened) {
        throw new DOMException('Device is not open', 'InvalidStateError')
      }
      return {
        packets: packetLengths.map((length) => ({
          status: 'ok' as USBTransferStatus,
          bytesWritten: length,
        })),
      }
    },

    async reset() {
      if (!isOpened) {
        throw new DOMException('Device is not open', 'InvalidStateError')
      }
      claimedInterfaces.clear()
      currentConfiguration = null
    },
  }

  return device
}

/**
 * Sets up mock for WebUSB API
 *
 * @example
 * ```typescript
 * import { setupMockUSB, USBDevicePresets } from '@ux.qa/frontmock'
 *
 * const { addDevice, simulateConnect, mockRequestDevice, cleanup } = setupMockUSB()
 *
 * // Add a mock Arduino device
 * const arduino = addDevice(USBDevicePresets.arduino)
 *
 * // Simulate user selecting device in browser dialog
 * mockRequestDevice.mockResolvedValueOnce(arduino)
 *
 * render(<USBDeviceManager />)
 *
 * // Click connect button
 * await userEvent.click(screen.getByText('Connect Device'))
 *
 * // Device should be connected
 * expect(screen.getByText(/Arduino/i)).toBeInTheDocument()
 *
 * // Simulate disconnection
 * simulateDisconnect(arduino)
 * expect(screen.getByText('No device connected')).toBeInTheDocument()
 *
 * cleanup()
 * ```
 *
 * @example
 * ```typescript
 * // Testing data transfer
 * const { addDevice, setTransferInResponse, cleanup } = setupMockUSB()
 *
 * const device = addDevice(USBDevicePresets.serialPort)
 *
 * // Set up mock response for transferIn
 * setTransferInResponse(1, new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f])) // "Hello"
 *
 * await device.open()
 * await device.selectConfiguration(1)
 * await device.claimInterface(0)
 *
 * const result = await device.transferIn(1, 64)
 * expect(result.status).toBe('ok')
 *
 * cleanup()
 * ```
 */
export function setupMockUSB(): MockUSBReturn {
  const availableDevices: MockUSBDevice[] = []
  const connectedDevices: MockUSBDevice[] = []
  const transferInResponses = new Map<number, Uint8Array>()
  const transferOutHandlers = new Map<number, (data: BufferSource) => void>()
  const eventListeners = new Map<string, Set<EventListener>>()

  const mockRequestDevice = vi.fn(
    async (options?: USBDeviceRequestOptions): Promise<USBDevice> => {
      if (availableDevices.length === 0) {
        throw new DOMException('No device selected', 'NotFoundError')
      }

      // Filter devices by options if provided
      let filteredDevices = availableDevices
      if (options?.filters && options.filters.length > 0) {
        filteredDevices = availableDevices.filter((device) =>
          options.filters!.some((filter) => {
            if (filter.vendorId !== undefined && filter.vendorId !== device.vendorId) {
              return false
            }
            if (filter.productId !== undefined && filter.productId !== device.productId) {
              return false
            }
            if (filter.classCode !== undefined && filter.classCode !== device.deviceClass) {
              return false
            }
            if (filter.subclassCode !== undefined && filter.subclassCode !== device.deviceSubclass) {
              return false
            }
            if (filter.protocolCode !== undefined && filter.protocolCode !== device.deviceProtocol) {
              return false
            }
            return true
          })
        )
      }

      if (filteredDevices.length === 0) {
        throw new DOMException('No device selected', 'NotFoundError')
      }

      // Return first matching device (simulates user selection)
      const device = filteredDevices[0]
      if (!connectedDevices.includes(device)) {
        connectedDevices.push(device)
      }
      return device as unknown as USBDevice
    }
  )

  const mockGetDevices = vi.fn(async (): Promise<USBDevice[]> => {
    return connectedDevices as unknown as USBDevice[]
  })

  // Create mock USB object
  const mockUSB = {
    requestDevice: mockRequestDevice,
    getDevices: mockGetDevices,
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      if (!eventListeners.has(type)) {
        eventListeners.set(type, new Set())
      }
      eventListeners.get(type)!.add(listener)
    }),
    removeEventListener: vi.fn((type: string, listener: EventListener) => {
      eventListeners.get(type)?.delete(listener)
    }),
    dispatchEvent: vi.fn((event: Event) => {
      const listeners = eventListeners.get(event.type)
      if (listeners) {
        listeners.forEach((listener) => {
          if (typeof listener === 'function') {
            listener(event)
          } else {
            listener.handleEvent(event)
          }
        })
      }
      return true
    }),
  }

  // Save original
  const originalUSB = (navigator as Navigator & { usb?: USB }).usb

  // Install mock
  Object.defineProperty(navigator, 'usb', {
    writable: true,
    configurable: true,
    value: mockUSB,
  })

  const addDevice = (config: MockUSBDeviceConfig): MockUSBDevice => {
    const device = createMockUSBDevice(config)

    // Override transferIn to use mock responses
    const originalTransferIn = device.transferIn
    ;(device as { transferIn: MockUSBDevice['transferIn'] }).transferIn = async (
      endpointNumber: number,
      length: number
    ): Promise<USBInTransferResult> => {
      if (!device.opened) {
        throw new DOMException('Device is not open', 'InvalidStateError')
      }
      const mockData = transferInResponses.get(endpointNumber)
      if (mockData) {
        return {
          status: 'ok',
          data: new DataView(mockData.buffer, mockData.byteOffset, mockData.byteLength),
        }
      }
      return originalTransferIn.call(device, endpointNumber, length)
    }

    // Override transferOut to use mock handlers
    const originalTransferOut = device.transferOut
    ;(device as { transferOut: MockUSBDevice['transferOut'] }).transferOut = async (
      endpointNumber: number,
      data: BufferSource
    ): Promise<USBOutTransferResult> => {
      if (!device.opened) {
        throw new DOMException('Device is not open', 'InvalidStateError')
      }
      const handler = transferOutHandlers.get(endpointNumber)
      if (handler) {
        handler(data)
      }
      return originalTransferOut.call(device, endpointNumber, data)
    }

    availableDevices.push(device)
    return device
  }

  const removeDevice = (device: MockUSBDevice) => {
    const availableIndex = availableDevices.indexOf(device)
    if (availableIndex !== -1) {
      availableDevices.splice(availableIndex, 1)
    }
    const connectedIndex = connectedDevices.indexOf(device)
    if (connectedIndex !== -1) {
      connectedDevices.splice(connectedIndex, 1)
    }
  }

  const getAvailableDevices = () => [...availableDevices]

  const getConnectedDevices = () => [...connectedDevices]

  const simulateConnect = (device: MockUSBDevice) => {
    if (!connectedDevices.includes(device)) {
      connectedDevices.push(device)
    }

    // Dispatch connect event
    const event = new Event('connect') as Event & { device: MockUSBDevice }
    Object.defineProperty(event, 'device', {
      value: device,
      writable: false,
    })
    mockUSB.dispatchEvent(event)
  }

  const simulateDisconnect = (device: MockUSBDevice) => {
    const index = connectedDevices.indexOf(device)
    if (index !== -1) {
      connectedDevices.splice(index, 1)
    }

    // Dispatch disconnect event
    const event = new Event('disconnect') as Event & { device: MockUSBDevice }
    Object.defineProperty(event, 'device', {
      value: device,
      writable: false,
    })
    mockUSB.dispatchEvent(event)
  }

  const setTransferInResponse = (endpointNumber: number, data: Uint8Array) => {
    transferInResponses.set(endpointNumber, data)
  }

  const setTransferOutHandler = (endpointNumber: number, handler: (data: BufferSource) => void) => {
    transferOutHandlers.set(endpointNumber, handler)
  }

  const cleanup = () => {
    // Restore original
    if (originalUSB !== undefined) {
      Object.defineProperty(navigator, 'usb', {
        writable: true,
        configurable: true,
        value: originalUSB,
      })
    } else {
      delete (navigator as Navigator & { usb?: USB }).usb
    }

    // Clear state
    availableDevices.length = 0
    connectedDevices.length = 0
    transferInResponses.clear()
    transferOutHandlers.clear()
    eventListeners.clear()

    // Clear mocks
    mockRequestDevice.mockClear()
    mockGetDevices.mockClear()
  }

  return {
    mockRequestDevice,
    mockGetDevices,
    addDevice,
    removeDevice,
    getAvailableDevices,
    getConnectedDevices,
    simulateConnect,
    simulateDisconnect,
    setTransferInResponse,
    setTransferOutHandler,
    cleanup,
  }
}

/**
 * USB device class codes
 */
export const USBClassCode = {
  AUDIO: 0x01,
  CDC_CONTROL: 0x02,
  HID: 0x03,
  PHYSICAL: 0x05,
  IMAGE: 0x06,
  PRINTER: 0x07,
  MASS_STORAGE: 0x08,
  HUB: 0x09,
  CDC_DATA: 0x0a,
  SMART_CARD: 0x0b,
  VIDEO: 0x0e,
  AUDIO_VIDEO: 0x10,
  WIRELESS: 0xe0,
  VENDOR_SPECIFIC: 0xff,
} as const

/**
 * Common USB device presets for testing
 */
export const USBDevicePresets = {
  arduino: {
    vendorId: 0x2341,
    productId: 0x0043,
    manufacturerName: 'Arduino LLC',
    productName: 'Arduino Uno',
    serialNumber: 'ARDUINO-001',
    deviceClass: USBClassCode.VENDOR_SPECIFIC,
    configurations: [
      {
        configurationValue: 1,
        configurationName: 'Default',
        interfaces: [
          {
            interfaceNumber: 0,
            alternate: {
              alternateSetting: 0,
              interfaceClass: USBClassCode.VENDOR_SPECIFIC,
              interfaceSubclass: 0,
              interfaceProtocol: 0,
              interfaceName: 'Arduino Serial',
              endpoints: [
                { endpointNumber: 1, direction: 'in', type: 'bulk', packetSize: 64 },
                { endpointNumber: 2, direction: 'out', type: 'bulk', packetSize: 64 },
              ],
            },
            alternates: [],
            claimed: false,
          },
        ],
      },
    ],
  } as MockUSBDeviceConfig,

  serialPort: {
    vendorId: 0x067b,
    productId: 0x2303,
    manufacturerName: 'Prolific Technology Inc.',
    productName: 'USB-Serial Controller',
    serialNumber: 'PL2303-001',
    deviceClass: USBClassCode.CDC_CONTROL,
    configurations: [
      {
        configurationValue: 1,
        configurationName: 'Default',
        interfaces: [
          {
            interfaceNumber: 0,
            alternate: {
              alternateSetting: 0,
              interfaceClass: USBClassCode.CDC_CONTROL,
              interfaceSubclass: 2,
              interfaceProtocol: 1,
              interfaceName: 'CDC Control',
              endpoints: [],
            },
            alternates: [],
            claimed: false,
          },
          {
            interfaceNumber: 1,
            alternate: {
              alternateSetting: 0,
              interfaceClass: USBClassCode.CDC_DATA,
              interfaceSubclass: 0,
              interfaceProtocol: 0,
              interfaceName: 'CDC Data',
              endpoints: [
                { endpointNumber: 1, direction: 'in', type: 'bulk', packetSize: 64 },
                { endpointNumber: 2, direction: 'out', type: 'bulk', packetSize: 64 },
              ],
            },
            alternates: [],
            claimed: false,
          },
        ],
      },
    ],
  } as MockUSBDeviceConfig,

  ledController: {
    vendorId: 0x16c0,
    productId: 0x05dc,
    manufacturerName: 'VOTI',
    productName: 'LED Controller',
    serialNumber: 'LED-001',
    deviceClass: USBClassCode.VENDOR_SPECIFIC,
    configurations: [
      {
        configurationValue: 1,
        configurationName: 'Default',
        interfaces: [
          {
            interfaceNumber: 0,
            alternate: {
              alternateSetting: 0,
              interfaceClass: USBClassCode.HID,
              interfaceSubclass: 0,
              interfaceProtocol: 0,
              interfaceName: 'HID Interface',
              endpoints: [
                { endpointNumber: 1, direction: 'in', type: 'interrupt', packetSize: 8 },
              ],
            },
            alternates: [],
            claimed: false,
          },
        ],
      },
    ],
  } as MockUSBDeviceConfig,

  gamepad: {
    vendorId: 0x045e,
    productId: 0x028e,
    manufacturerName: 'Microsoft Corp.',
    productName: 'Xbox360 Controller',
    serialNumber: 'XBOX-001',
    deviceClass: USBClassCode.VENDOR_SPECIFIC,
    configurations: [
      {
        configurationValue: 1,
        configurationName: 'Default',
        interfaces: [
          {
            interfaceNumber: 0,
            alternate: {
              alternateSetting: 0,
              interfaceClass: USBClassCode.VENDOR_SPECIFIC,
              interfaceSubclass: 93,
              interfaceProtocol: 1,
              interfaceName: 'Xbox 360 Controller',
              endpoints: [
                { endpointNumber: 1, direction: 'in', type: 'interrupt', packetSize: 32 },
                { endpointNumber: 2, direction: 'out', type: 'interrupt', packetSize: 32 },
              ],
            },
            alternates: [],
            claimed: false,
          },
        ],
      },
    ],
  } as MockUSBDeviceConfig,

  printer: {
    vendorId: 0x04a9,
    productId: 0x1746,
    manufacturerName: 'Canon, Inc.',
    productName: 'USB Printer',
    serialNumber: 'PRINTER-001',
    deviceClass: USBClassCode.PRINTER,
    configurations: [
      {
        configurationValue: 1,
        configurationName: 'Default',
        interfaces: [
          {
            interfaceNumber: 0,
            alternate: {
              alternateSetting: 0,
              interfaceClass: USBClassCode.PRINTER,
              interfaceSubclass: 1,
              interfaceProtocol: 2,
              interfaceName: 'Printer Interface',
              endpoints: [
                { endpointNumber: 1, direction: 'in', type: 'bulk', packetSize: 512 },
                { endpointNumber: 2, direction: 'out', type: 'bulk', packetSize: 512 },
              ],
            },
            alternates: [],
            claimed: false,
          },
        ],
      },
    ],
  } as MockUSBDeviceConfig,

  massStorage: {
    vendorId: 0x0781,
    productId: 0x5567,
    manufacturerName: 'SanDisk Corp.',
    productName: 'USB Flash Drive',
    serialNumber: 'SANDISK-001',
    deviceClass: USBClassCode.MASS_STORAGE,
    configurations: [
      {
        configurationValue: 1,
        configurationName: 'Default',
        interfaces: [
          {
            interfaceNumber: 0,
            alternate: {
              alternateSetting: 0,
              interfaceClass: USBClassCode.MASS_STORAGE,
              interfaceSubclass: 6,
              interfaceProtocol: 80,
              interfaceName: 'Mass Storage',
              endpoints: [
                { endpointNumber: 1, direction: 'in', type: 'bulk', packetSize: 512 },
                { endpointNumber: 2, direction: 'out', type: 'bulk', packetSize: 512 },
              ],
            },
            alternates: [],
            claimed: false,
          },
        ],
      },
    ],
  } as MockUSBDeviceConfig,

  webcam: {
    vendorId: 0x046d,
    productId: 0x0825,
    manufacturerName: 'Logitech, Inc.',
    productName: 'HD Webcam C270',
    serialNumber: 'WEBCAM-001',
    deviceClass: USBClassCode.VIDEO,
    configurations: [
      {
        configurationValue: 1,
        configurationName: 'Default',
        interfaces: [
          {
            interfaceNumber: 0,
            alternate: {
              alternateSetting: 0,
              interfaceClass: USBClassCode.VIDEO,
              interfaceSubclass: 1,
              interfaceProtocol: 0,
              interfaceName: 'Video Control',
              endpoints: [
                { endpointNumber: 1, direction: 'in', type: 'interrupt', packetSize: 16 },
              ],
            },
            alternates: [],
            claimed: false,
          },
          {
            interfaceNumber: 1,
            alternate: {
              alternateSetting: 0,
              interfaceClass: USBClassCode.VIDEO,
              interfaceSubclass: 2,
              interfaceProtocol: 0,
              interfaceName: 'Video Streaming',
              endpoints: [
                { endpointNumber: 2, direction: 'in', type: 'isochronous', packetSize: 1024 },
              ],
            },
            alternates: [],
            claimed: false,
          },
        ],
      },
    ],
  } as MockUSBDeviceConfig,

  keyboard: {
    vendorId: 0x04d9,
    productId: 0xa096,
    manufacturerName: 'Holtek Semiconductor, Inc.',
    productName: 'USB Keyboard',
    serialNumber: 'KEYBOARD-001',
    deviceClass: 0,
    configurations: [
      {
        configurationValue: 1,
        configurationName: 'Default',
        interfaces: [
          {
            interfaceNumber: 0,
            alternate: {
              alternateSetting: 0,
              interfaceClass: USBClassCode.HID,
              interfaceSubclass: 1,
              interfaceProtocol: 1,
              interfaceName: 'HID Keyboard',
              endpoints: [
                { endpointNumber: 1, direction: 'in', type: 'interrupt', packetSize: 8 },
              ],
            },
            alternates: [],
            claimed: false,
          },
        ],
      },
    ],
  } as MockUSBDeviceConfig,
} as const

/**
 * USB transfer status values
 */
export const USBTransferStatusValues = {
  OK: 'ok' as const,
  STALL: 'stall' as const,
  BABBLE: 'babble' as const,
} as const
