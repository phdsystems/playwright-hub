/**
 * MockSerialPort - Mock Web Serial API for testing
 *
 * Allows testing serial port communication without actual hardware
 */

export interface MockSerialPortInfo {
  usbVendorId?: number
  usbProductId?: number
}

export interface MockSerialPortOptions {
  baudRate: number
  dataBits?: number
  stopBits?: number
  parity?: 'none' | 'even' | 'odd'
  bufferSize?: number
  flowControl?: 'none' | 'hardware'
}

export interface MockSerialPortDevice {
  info: MockSerialPortInfo
  readable: ReadableStream<Uint8Array> | null
  writable: WritableStream<Uint8Array> | null
  open: (options: MockSerialPortOptions) => Promise<void>
  close: () => Promise<void>
  getInfo: () => MockSerialPortInfo
  forget: () => Promise<void>
  addEventListener: (type: string, listener: EventListener) => void
  removeEventListener: (type: string, listener: EventListener) => void
}

export interface MockSerialReturn {
  mockRequestPort: ReturnType<typeof vi.fn>
  mockGetPorts: ReturnType<typeof vi.fn>
  addPort: (info?: MockSerialPortInfo) => MockSerialPortDevice
  removePort: (port: MockSerialPortDevice) => void
  getConnectedPorts: () => MockSerialPortDevice[]
  simulateReceiveData: (port: MockSerialPortDevice, data: Uint8Array) => void
  getWrittenData: (port: MockSerialPortDevice) => Uint8Array[]
  clearWrittenData: (port: MockSerialPortDevice) => void
  triggerConnect: (port: MockSerialPortDevice) => void
  triggerDisconnect: (port: MockSerialPortDevice) => void
  cleanup: () => void
}

/**
 * Sets up mock for Web Serial API
 *
 * @example
 * ```typescript
 * import { setupMockSerialPort } from '@ux.qa/frontmock'
 *
 * const {
 *   addPort,
 *   mockRequestPort,
 *   simulateReceiveData,
 *   getWrittenData,
 *   cleanup
 * } = setupMockSerialPort()
 *
 * // Add an available port
 * const port = addPort({ usbVendorId: 0x2341, usbProductId: 0x0043 })
 *
 * render(<SerialTerminal />)
 *
 * // User clicks connect button
 * await userEvent.click(screen.getByText('Connect'))
 *
 * // Verify requestPort was called
 * expect(mockRequestPort).toHaveBeenCalled()
 *
 * // Simulate receiving data from device
 * const encoder = new TextEncoder()
 * simulateReceiveData(port, encoder.encode('Hello from device'))
 *
 * // Verify data appears in UI
 * await waitFor(() => {
 *   expect(screen.getByText(/Hello from device/)).toBeInTheDocument()
 * })
 *
 * // Check what was written to the port
 * const written = getWrittenData(port)
 * expect(written.length).toBeGreaterThan(0)
 *
 * cleanup()
 * ```
 */
export function setupMockSerialPort(): MockSerialReturn {
  const availablePorts: MockSerialPortDevice[] = []
  const connectedPorts: MockSerialPortDevice[] = []
  const portWrittenData = new Map<MockSerialPortDevice, Uint8Array[]>()
  const portReadControllers = new Map<MockSerialPortDevice, ReadableStreamDefaultController<Uint8Array>>()
  const portEventListeners = new Map<MockSerialPortDevice, Map<string, Set<EventListener>>>()
  const serialEventListeners = new Map<string, Set<EventListener>>()

  const createMockPort = (info: MockSerialPortInfo = {}): MockSerialPortDevice => {
    let isOpen = false
    let readableController: ReadableStreamDefaultController<Uint8Array> | null = null
    let writableStream: WritableStream<Uint8Array> | null = null
    let readableStream: ReadableStream<Uint8Array> | null = null

    const port: MockSerialPortDevice = {
      info,
      readable: null,
      writable: null,

      open: vi.fn(async (options: MockSerialPortOptions) => {
        if (isOpen) {
          throw new DOMException('Port is already open', 'InvalidStateError')
        }

        isOpen = true

        // Create readable stream for receiving data
        readableStream = new ReadableStream<Uint8Array>({
          start(controller) {
            readableController = controller
            portReadControllers.set(port, controller)
          },
          cancel() {
            readableController = null
            portReadControllers.delete(port)
          },
        })

        // Create writable stream for sending data
        writableStream = new WritableStream<Uint8Array>({
          write(chunk) {
            const existing = portWrittenData.get(port) || []
            existing.push(chunk)
            portWrittenData.set(port, existing)
          },
        })

        port.readable = readableStream
        port.writable = writableStream

        if (!connectedPorts.includes(port)) {
          connectedPorts.push(port)
        }
      }),

      close: vi.fn(async () => {
        if (!isOpen) {
          throw new DOMException('Port is not open', 'InvalidStateError')
        }

        isOpen = false

        // Close streams
        if (readableController) {
          try {
            readableController.close()
          } catch {
            // Stream may already be closed
          }
          readableController = null
          portReadControllers.delete(port)
        }

        port.readable = null
        port.writable = null

        const index = connectedPorts.indexOf(port)
        if (index > -1) {
          connectedPorts.splice(index, 1)
        }
      }),

      getInfo: vi.fn(() => info),

      forget: vi.fn(async () => {
        const index = availablePorts.indexOf(port)
        if (index > -1) {
          availablePorts.splice(index, 1)
        }
        portWrittenData.delete(port)
        portEventListeners.delete(port)
      }),

      addEventListener: vi.fn((type: string, listener: EventListener) => {
        if (!portEventListeners.has(port)) {
          portEventListeners.set(port, new Map())
        }
        const listeners = portEventListeners.get(port)!
        if (!listeners.has(type)) {
          listeners.set(type, new Set())
        }
        listeners.get(type)!.add(listener)
      }),

      removeEventListener: vi.fn((type: string, listener: EventListener) => {
        const listeners = portEventListeners.get(port)
        if (listeners && listeners.has(type)) {
          listeners.get(type)!.delete(listener)
        }
      }),
    }

    return port
  }

  const mockRequestPort = vi.fn(async (options?: { filters?: { usbVendorId?: number; usbProductId?: number }[] }) => {
    if (availablePorts.length === 0) {
      throw new DOMException('No port selected by the user', 'NotFoundError')
    }

    // If filters provided, find matching port
    if (options?.filters && options.filters.length > 0) {
      for (const filter of options.filters) {
        const matchingPort = availablePorts.find((port) => {
          const info = port.getInfo()
          if (filter.usbVendorId !== undefined && info.usbVendorId !== filter.usbVendorId) {
            return false
          }
          if (filter.usbProductId !== undefined && info.usbProductId !== filter.usbProductId) {
            return false
          }
          return true
        })
        if (matchingPort) {
          return matchingPort
        }
      }
      throw new DOMException('No port selected by the user', 'NotFoundError')
    }

    // Return first available port
    return availablePorts[0]
  })

  const mockGetPorts = vi.fn(async () => {
    return [...connectedPorts]
  })

  const mockSerial = {
    requestPort: mockRequestPort,
    getPorts: mockGetPorts,
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      if (!serialEventListeners.has(type)) {
        serialEventListeners.set(type, new Set())
      }
      serialEventListeners.get(type)!.add(listener)
    }),
    removeEventListener: vi.fn((type: string, listener: EventListener) => {
      if (serialEventListeners.has(type)) {
        serialEventListeners.get(type)!.delete(listener)
      }
    }),
  }

  const originalSerial = (navigator as { serial?: typeof mockSerial }).serial

  // Install mock
  Object.defineProperty(navigator, 'serial', {
    writable: true,
    configurable: true,
    value: mockSerial,
  })

  const addPort = (info: MockSerialPortInfo = {}): MockSerialPortDevice => {
    const port = createMockPort(info)
    availablePorts.push(port)
    portWrittenData.set(port, [])
    return port
  }

  const removePort = (port: MockSerialPortDevice) => {
    const availableIndex = availablePorts.indexOf(port)
    if (availableIndex > -1) {
      availablePorts.splice(availableIndex, 1)
    }
    const connectedIndex = connectedPorts.indexOf(port)
    if (connectedIndex > -1) {
      connectedPorts.splice(connectedIndex, 1)
    }
    portWrittenData.delete(port)
    portReadControllers.delete(port)
    portEventListeners.delete(port)
  }

  const getConnectedPorts = () => {
    return [...connectedPorts]
  }

  const simulateReceiveData = (port: MockSerialPortDevice, data: Uint8Array) => {
    const controller = portReadControllers.get(port)
    if (controller) {
      controller.enqueue(data)
    } else {
      console.warn('Port readable stream not initialized. Make sure port.open() was called.')
    }
  }

  const getWrittenData = (port: MockSerialPortDevice): Uint8Array[] => {
    return portWrittenData.get(port) || []
  }

  const clearWrittenData = (port: MockSerialPortDevice) => {
    portWrittenData.set(port, [])
  }

  const triggerConnect = (port: MockSerialPortDevice) => {
    const event = new Event('connect')
    Object.defineProperty(event, 'target', { value: port })

    // Trigger serial-level connect event
    const listeners = serialEventListeners.get('connect')
    if (listeners) {
      listeners.forEach((listener) => listener(event))
    }
  }

  const triggerDisconnect = (port: MockSerialPortDevice) => {
    const event = new Event('disconnect')
    Object.defineProperty(event, 'target', { value: port })

    // Trigger serial-level disconnect event
    const listeners = serialEventListeners.get('disconnect')
    if (listeners) {
      listeners.forEach((listener) => listener(event))
    }

    // Auto-remove from connected
    const index = connectedPorts.indexOf(port)
    if (index > -1) {
      connectedPorts.splice(index, 1)
    }
  }

  const cleanup = () => {
    // Restore original
    if (originalSerial !== undefined) {
      Object.defineProperty(navigator, 'serial', {
        writable: true,
        configurable: true,
        value: originalSerial,
      })
    } else {
      // Remove the property if it didn't exist before
      delete (navigator as { serial?: typeof mockSerial }).serial
    }

    // Clear all state
    availablePorts.length = 0
    connectedPorts.length = 0
    portWrittenData.clear()
    portReadControllers.clear()
    portEventListeners.clear()
    serialEventListeners.clear()

    mockRequestPort.mockClear()
    mockGetPorts.mockClear()
  }

  return {
    mockRequestPort,
    mockGetPorts,
    addPort,
    removePort,
    getConnectedPorts,
    simulateReceiveData,
    getWrittenData,
    clearWrittenData,
    triggerConnect,
    triggerDisconnect,
    cleanup,
  }
}

/**
 * Common serial port info presets for testing
 */
export const SerialPortPresets = {
  arduinoUno: { usbVendorId: 0x2341, usbProductId: 0x0043 },
  arduinoMega: { usbVendorId: 0x2341, usbProductId: 0x0042 },
  esp32: { usbVendorId: 0x10c4, usbProductId: 0xea60 },
  ch340: { usbVendorId: 0x1a86, usbProductId: 0x7523 },
  ftdi: { usbVendorId: 0x0403, usbProductId: 0x6001 },
  cp2102: { usbVendorId: 0x10c4, usbProductId: 0xea60 },
  stm32: { usbVendorId: 0x0483, usbProductId: 0x5740 },
  teensy: { usbVendorId: 0x16c0, usbProductId: 0x0483 },
} as const

/**
 * Common baud rate presets
 */
export const BaudRatePresets = {
  slow: 9600,
  standard: 115200,
  fast: 921600,
  midi: 31250,
} as const

/**
 * Serial port error codes
 */
export const SerialPortErrorCode = {
  NOT_FOUND: 'NotFoundError',
  SECURITY: 'SecurityError',
  INVALID_STATE: 'InvalidStateError',
  NETWORK: 'NetworkError',
  ABORT: 'AbortError',
} as const
