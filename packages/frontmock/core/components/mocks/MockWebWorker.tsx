/**
 * MockWebWorker - Mock Web Worker API for testing
 *
 * Simulates background thread workers without actual worker threads
 */

export interface MockWorkerInstance {
  url: string
  onmessage: ((event: MessageEvent) => void) | null
  onerror: ((event: ErrorEvent) => void) | null
  postMessage: ReturnType<typeof vi.fn>
  terminate: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
}

export interface MockWebWorkerReturn {
  instances: MockWorkerInstance[]
  getLastInstance: () => MockWorkerInstance | undefined
  triggerMessage: (data: any, instance?: MockWorkerInstance) => void
  triggerError: (error: Error, instance?: MockWorkerInstance) => void
  getPostedMessages: (instance?: MockWorkerInstance) => any[]
  cleanup: () => void
}

/**
 * Sets up mock for Web Worker API
 *
 * @example
 * ```typescript
 * import { setupMockWebWorker } from '@ux.qa/frontmock'
 *
 * const { getLastInstance, triggerMessage, cleanup } = setupMockWebWorker()
 *
 * render(<DataProcessorComponent />)
 *
 * // Component creates a worker
 * const worker = getLastInstance()
 * expect(worker?.url).toContain('processor.worker.js')
 *
 * // Simulate worker responding with processed data
 * triggerMessage({ type: 'result', data: [1, 2, 3] })
 *
 * // Verify component displays results
 * expect(screen.getByText('Processed: 3 items')).toBeInTheDocument()
 *
 * cleanup()
 * ```
 */
export function setupMockWebWorker(): MockWebWorkerReturn {
  const instances: MockWorkerInstance[] = []
  const postedMessages = new Map<MockWorkerInstance, any[]>()
  const eventListeners = new Map<MockWorkerInstance, Map<string, Set<EventListener>>>()

  class MockWorkerClass implements Worker {
    url: string
    onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null
    onmessageerror: ((this: Worker, ev: MessageEvent) => any) | null = null
    onerror: ((this: AbstractWorker, ev: ErrorEvent) => any) | null = null

    postMessage = vi.fn((message: any, transfer?: Transferable[]) => {
      if (!postedMessages.has(this as any)) {
        postedMessages.set(this as any, [])
      }
      postedMessages.get(this as any)!.push(message)
    })

    terminate = vi.fn(() => {
      // Cleanup this instance
      const index = instances.indexOf(this as any)
      if (index > -1) {
        instances.splice(index, 1)
      }
    })

    addEventListener = vi.fn(<K extends keyof WorkerEventMap>(
      type: K,
      listener: EventListenerOrEventListenerObject
    ) => {
      if (!eventListeners.has(this as any)) {
        eventListeners.set(this as any, new Map())
      }
      const typeMap = eventListeners.get(this as any)!
      if (!typeMap.has(type)) {
        typeMap.set(type, new Set())
      }
      typeMap.get(type)!.add(listener as EventListener)
    })

    removeEventListener = vi.fn(<K extends keyof WorkerEventMap>(
      type: K,
      listener: EventListenerOrEventListenerObject
    ) => {
      const typeMap = eventListeners.get(this as any)
      if (typeMap?.has(type)) {
        typeMap.get(type)!.delete(listener as EventListener)
      }
    })

    dispatchEvent = vi.fn((event: Event): boolean => {
      return true
    })

    constructor(scriptURL: string | URL, options?: WorkerOptions) {
      this.url = scriptURL.toString()
      instances.push(this as any)
      postedMessages.set(this as any, [])
    }
  }

  const originalWorker = global.Worker

  // Install mock
  global.Worker = MockWorkerClass as any

  const getLastInstance = () => {
    return instances[instances.length - 1]
  }

  const triggerMessage = (data: any, instance?: MockWorkerInstance) => {
    const worker = instance ?? getLastInstance()
    if (!worker) {
      throw new Error('No Worker instance found')
    }

    const event = new MessageEvent('message', { data })
    worker.onmessage?.(event)

    // Also trigger addEventListener listeners
    const typeMap = eventListeners.get(worker)
    if (typeMap?.has('message')) {
      typeMap.get('message')!.forEach((listener) => listener(event))
    }
  }

  const triggerError = (error: Error, instance?: MockWorkerInstance) => {
    const worker = instance ?? getLastInstance()
    if (!worker) {
      throw new Error('No Worker instance found')
    }

    const event = new ErrorEvent('error', {
      message: error.message,
      error,
    })
    worker.onerror?.(event)

    // Also trigger addEventListener listeners
    const typeMap = eventListeners.get(worker)
    if (typeMap?.has('error')) {
      typeMap.get('error')!.forEach((listener) => listener(event))
    }
  }

  const getPostedMessages = (instance?: MockWorkerInstance) => {
    const worker = instance ?? getLastInstance()
    if (!worker) {
      return []
    }
    return postedMessages.get(worker) ?? []
  }

  const cleanup = () => {
    // Terminate all workers
    instances.forEach((w) => w.terminate())
    instances.length = 0
    postedMessages.clear()
    eventListeners.clear()

    // Restore original
    global.Worker = originalWorker
  }

  return {
    instances,
    getLastInstance,
    triggerMessage,
    triggerError,
    getPostedMessages,
    cleanup,
  }
}

/**
 * Worker message types for structured communication
 */
export const WorkerMessageType = {
  INIT: 'init',
  PROCESS: 'process',
  RESULT: 'result',
  ERROR: 'error',
  PROGRESS: 'progress',
  COMPLETE: 'complete',
} as const
