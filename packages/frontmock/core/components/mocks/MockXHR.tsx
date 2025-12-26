/**
 * MockXHR - Mock XMLHttpRequest for testing
 *
 * Allows testing AJAX/XHR-based features without actual network requests
 */

export interface MockXHRRequest {
  method: string
  url: string
  async: boolean
  headers: Record<string, string>
  body: Document | XMLHttpRequestBodyInit | null
  withCredentials: boolean
  timeout: number
  responseType: XMLHttpRequestResponseType
}

export interface MockXHRResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  responseText: string
  responseXML: Document | null
  response: unknown
}

export interface MockXHRInstance {
  request: MockXHRRequest
  response: MockXHRResponse
  readyState: number
  onreadystatechange: ((this: XMLHttpRequest, ev: Event) => unknown) | null
  onload: ((this: XMLHttpRequest, ev: ProgressEvent) => unknown) | null
  onerror: ((this: XMLHttpRequest, ev: ProgressEvent) => unknown) | null
  onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => unknown) | null
  onabort: ((this: XMLHttpRequest, ev: ProgressEvent) => unknown) | null
  ontimeout: ((this: XMLHttpRequest, ev: ProgressEvent) => unknown) | null
  onloadstart: ((this: XMLHttpRequest, ev: ProgressEvent) => unknown) | null
  onloadend: ((this: XMLHttpRequest, ev: ProgressEvent) => unknown) | null
  upload: {
    onprogress: ((this: XMLHttpRequestUpload, ev: ProgressEvent) => unknown) | null
    onload: ((this: XMLHttpRequestUpload, ev: ProgressEvent) => unknown) | null
    onerror: ((this: XMLHttpRequestUpload, ev: ProgressEvent) => unknown) | null
    onabort: ((this: XMLHttpRequestUpload, ev: ProgressEvent) => unknown) | null
    ontimeout: ((this: XMLHttpRequestUpload, ev: ProgressEvent) => unknown) | null
    onloadstart: ((this: XMLHttpRequestUpload, ev: ProgressEvent) => unknown) | null
    onloadend: ((this: XMLHttpRequestUpload, ev: ProgressEvent) => unknown) | null
  }
  abort: () => void
  getAllResponseHeaders: () => string
  getResponseHeader: (name: string) => string | null
}

export interface MockXHRReturn {
  mockOpen: ReturnType<typeof vi.fn>
  mockSend: ReturnType<typeof vi.fn>
  mockSetRequestHeader: ReturnType<typeof vi.fn>
  mockAbort: ReturnType<typeof vi.fn>
  mockGetAllResponseHeaders: ReturnType<typeof vi.fn>
  mockGetResponseHeader: ReturnType<typeof vi.fn>
  getRequests: () => MockXHRRequest[]
  getLastRequest: () => MockXHRRequest | undefined
  getInstances: () => MockXHRInstance[]
  getLastInstance: () => MockXHRInstance | undefined
  respondWith: (response: Partial<MockXHRResponse>) => void
  respondToRequest: (index: number, response: Partial<MockXHRResponse>) => void
  triggerProgress: (loaded: number, total: number, lengthComputable?: boolean) => void
  triggerUploadProgress: (loaded: number, total: number, lengthComputable?: boolean) => void
  triggerError: (message?: string) => void
  triggerTimeout: () => void
  triggerAbort: () => void
  setDefaultResponse: (response: Partial<MockXHRResponse>) => void
  cleanup: () => void
}

/**
 * Sets up mock for XMLHttpRequest
 *
 * @example
 * ```typescript
 * import { setupMockXHR } from '@ux.qa/frontmock'
 *
 * const {
 *   mockOpen,
 *   mockSend,
 *   getLastRequest,
 *   respondWith,
 *   cleanup
 * } = setupMockXHR()
 *
 * render(<DataFetcher />)
 *
 * // Click button that triggers XHR request
 * await userEvent.click(screen.getByRole('button', { name: /fetch/i }))
 *
 * // Verify request was made
 * const request = getLastRequest()
 * expect(request?.method).toBe('GET')
 * expect(request?.url).toBe('/api/data')
 *
 * // Respond with mock data
 * respondWith({
 *   status: 200,
 *   statusText: 'OK',
 *   responseText: JSON.stringify({ message: 'Hello' })
 * })
 *
 * // Verify UI updated
 * expect(await screen.findByText(/Hello/i)).toBeInTheDocument()
 *
 * cleanup()
 * ```
 *
 * @example
 * ```typescript
 * // Testing error handling
 * const { triggerError, cleanup } = setupMockXHR()
 *
 * render(<DataFetcher />)
 * await userEvent.click(screen.getByRole('button', { name: /fetch/i }))
 *
 * // Trigger network error
 * triggerError('Network failure')
 *
 * expect(await screen.findByText(/error/i)).toBeInTheDocument()
 *
 * cleanup()
 * ```
 *
 * @example
 * ```typescript
 * // Testing upload progress
 * const { triggerUploadProgress, respondWith, cleanup } = setupMockXHR()
 *
 * render(<FileUploader />)
 * await userEvent.upload(screen.getByLabelText(/file/i), file)
 *
 * // Simulate upload progress
 * triggerUploadProgress(50, 100)
 * expect(screen.getByText('50%')).toBeInTheDocument()
 *
 * triggerUploadProgress(100, 100)
 * respondWith({ status: 200, statusText: 'OK' })
 *
 * cleanup()
 * ```
 */
export function setupMockXHR(): MockXHRReturn {
  const requests: MockXHRRequest[] = []
  const instances: MockXHRInstance[] = []
  let currentInstance: MockXHRInstance | null = null

  let defaultResponse: MockXHRResponse = {
    status: 200,
    statusText: 'OK',
    headers: {},
    responseText: '',
    responseXML: null,
    response: null,
  }

  const mockOpen = vi.fn()
  const mockSend = vi.fn()
  const mockSetRequestHeader = vi.fn()
  const mockAbort = vi.fn()
  const mockGetAllResponseHeaders = vi.fn()
  const mockGetResponseHeader = vi.fn()

  const originalXHR = window.XMLHttpRequest

  // Create mock XMLHttpRequest class
  const MockXMLHttpRequest = vi.fn(function (this: MockXHRInstance) {
    const instance: MockXHRInstance = {
      request: {
        method: '',
        url: '',
        async: true,
        headers: {},
        body: null,
        withCredentials: false,
        timeout: 0,
        responseType: '' as XMLHttpRequestResponseType,
      },
      response: { ...defaultResponse },
      readyState: 0, // UNSENT
      onreadystatechange: null,
      onload: null,
      onerror: null,
      onprogress: null,
      onabort: null,
      ontimeout: null,
      onloadstart: null,
      onloadend: null,
      upload: {
        onprogress: null,
        onload: null,
        onerror: null,
        onabort: null,
        ontimeout: null,
        onloadstart: null,
        onloadend: null,
      },
      abort: () => {},
      getAllResponseHeaders: () => '',
      getResponseHeader: () => null,
    }

    instances.push(instance)
    currentInstance = instance

    // Define properties with getters/setters for the actual XHR interface
    const xhrInstance = this as unknown as XMLHttpRequest & MockXHRInstance

    Object.defineProperties(xhrInstance, {
      readyState: {
        get: () => instance.readyState,
        set: (value: number) => {
          instance.readyState = value
        },
      },
      status: {
        get: () => instance.response.status,
      },
      statusText: {
        get: () => instance.response.statusText,
      },
      responseText: {
        get: () => instance.response.responseText,
      },
      responseXML: {
        get: () => instance.response.responseXML,
      },
      response: {
        get: () => {
          if (instance.request.responseType === '' || instance.request.responseType === 'text') {
            return instance.response.responseText
          }
          if (instance.request.responseType === 'json') {
            try {
              return JSON.parse(instance.response.responseText)
            } catch {
              return null
            }
          }
          return instance.response.response
        },
      },
      responseType: {
        get: () => instance.request.responseType,
        set: (value: XMLHttpRequestResponseType) => {
          instance.request.responseType = value
        },
      },
      timeout: {
        get: () => instance.request.timeout,
        set: (value: number) => {
          instance.request.timeout = value
        },
      },
      withCredentials: {
        get: () => instance.request.withCredentials,
        set: (value: boolean) => {
          instance.request.withCredentials = value
        },
      },
      onreadystatechange: {
        get: () => instance.onreadystatechange,
        set: (value: ((this: XMLHttpRequest, ev: Event) => unknown) | null) => {
          instance.onreadystatechange = value
        },
      },
      onload: {
        get: () => instance.onload,
        set: (value: ((this: XMLHttpRequest, ev: ProgressEvent) => unknown) | null) => {
          instance.onload = value
        },
      },
      onerror: {
        get: () => instance.onerror,
        set: (value: ((this: XMLHttpRequest, ev: ProgressEvent) => unknown) | null) => {
          instance.onerror = value
        },
      },
      onprogress: {
        get: () => instance.onprogress,
        set: (value: ((this: XMLHttpRequest, ev: ProgressEvent) => unknown) | null) => {
          instance.onprogress = value
        },
      },
      onabort: {
        get: () => instance.onabort,
        set: (value: ((this: XMLHttpRequest, ev: ProgressEvent) => unknown) | null) => {
          instance.onabort = value
        },
      },
      ontimeout: {
        get: () => instance.ontimeout,
        set: (value: ((this: XMLHttpRequest, ev: ProgressEvent) => unknown) | null) => {
          instance.ontimeout = value
        },
      },
      onloadstart: {
        get: () => instance.onloadstart,
        set: (value: ((this: XMLHttpRequest, ev: ProgressEvent) => unknown) | null) => {
          instance.onloadstart = value
        },
      },
      onloadend: {
        get: () => instance.onloadend,
        set: (value: ((this: XMLHttpRequest, ev: ProgressEvent) => unknown) | null) => {
          instance.onloadend = value
        },
      },
      upload: {
        get: () => instance.upload,
      },
    })

    xhrInstance.open = function (
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ) {
      instance.request.method = method
      instance.request.url = url.toString()
      instance.request.async = async
      instance.readyState = 1 // OPENED

      mockOpen(method, url, async, username, password)

      if (instance.onreadystatechange) {
        instance.onreadystatechange.call(xhrInstance as XMLHttpRequest, new Event('readystatechange'))
      }
    }

    xhrInstance.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      instance.request.body = body ?? null
      requests.push({ ...instance.request })

      mockSend(body)

      // Trigger loadstart
      if (instance.onloadstart) {
        const event = createProgressEvent('loadstart', 0, 0, false)
        instance.onloadstart.call(xhrInstance as XMLHttpRequest, event)
      }

      // Trigger upload loadstart if there's a body
      if (body && instance.upload.onloadstart) {
        const event = createProgressEvent('loadstart', 0, 0, false)
        instance.upload.onloadstart.call(xhrInstance.upload as XMLHttpRequestUpload, event)
      }
    }

    xhrInstance.setRequestHeader = function (name: string, value: string) {
      instance.request.headers[name] = value
      mockSetRequestHeader(name, value)
    }

    xhrInstance.abort = function () {
      instance.readyState = 0
      mockAbort()

      if (instance.onabort) {
        const event = createProgressEvent('abort', 0, 0, false)
        instance.onabort.call(xhrInstance as XMLHttpRequest, event)
      }

      if (instance.onloadend) {
        const event = createProgressEvent('loadend', 0, 0, false)
        instance.onloadend.call(xhrInstance as XMLHttpRequest, event)
      }
    }

    instance.abort = xhrInstance.abort

    xhrInstance.getAllResponseHeaders = function () {
      const headers = Object.entries(instance.response.headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\r\n')
      mockGetAllResponseHeaders()
      return headers
    }

    instance.getAllResponseHeaders = xhrInstance.getAllResponseHeaders

    xhrInstance.getResponseHeader = function (name: string) {
      mockGetResponseHeader(name)
      const lowerName = name.toLowerCase()
      for (const [key, value] of Object.entries(instance.response.headers)) {
        if (key.toLowerCase() === lowerName) {
          return value
        }
      }
      return null
    }

    instance.getResponseHeader = xhrInstance.getResponseHeader

    // Add static constants
    ;(xhrInstance as unknown as Record<string, number>).UNSENT = 0
    ;(xhrInstance as unknown as Record<string, number>).OPENED = 1
    ;(xhrInstance as unknown as Record<string, number>).HEADERS_RECEIVED = 2
    ;(xhrInstance as unknown as Record<string, number>).LOADING = 3
    ;(xhrInstance as unknown as Record<string, number>).DONE = 4

    return xhrInstance
  }) as unknown as typeof XMLHttpRequest

  // Add static constants to the class
  ;(MockXMLHttpRequest as unknown as Record<string, number>).UNSENT = 0
  ;(MockXMLHttpRequest as unknown as Record<string, number>).OPENED = 1
  ;(MockXMLHttpRequest as unknown as Record<string, number>).HEADERS_RECEIVED = 2
  ;(MockXMLHttpRequest as unknown as Record<string, number>).LOADING = 3
  ;(MockXMLHttpRequest as unknown as Record<string, number>).DONE = 4

  // Install mock
  ;(window as unknown as Record<string, unknown>).XMLHttpRequest = MockXMLHttpRequest

  function createProgressEvent(
    type: string,
    loaded: number,
    total: number,
    lengthComputable: boolean
  ): ProgressEvent {
    return new ProgressEvent(type, {
      loaded,
      total,
      lengthComputable,
    })
  }

  function triggerReadyStateChange(instance: MockXHRInstance, readyState: number) {
    instance.readyState = readyState
    if (instance.onreadystatechange) {
      instance.onreadystatechange.call(
        instance as unknown as XMLHttpRequest,
        new Event('readystatechange')
      )
    }
  }

  const respondToInstance = (instance: MockXHRInstance, response: Partial<MockXHRResponse>) => {
    // Merge response
    instance.response = {
      ...defaultResponse,
      ...response,
    }

    // Trigger readyState changes
    triggerReadyStateChange(instance, 2) // HEADERS_RECEIVED
    triggerReadyStateChange(instance, 3) // LOADING

    // Trigger progress event
    if (instance.onprogress) {
      const responseLength = instance.response.responseText.length
      const event = createProgressEvent('progress', responseLength, responseLength, true)
      instance.onprogress.call(instance as unknown as XMLHttpRequest, event)
    }

    triggerReadyStateChange(instance, 4) // DONE

    // Trigger load event
    if (instance.onload) {
      const responseLength = instance.response.responseText.length
      const event = createProgressEvent('load', responseLength, responseLength, true)
      instance.onload.call(instance as unknown as XMLHttpRequest, event)
    }

    // Trigger loadend event
    if (instance.onloadend) {
      const responseLength = instance.response.responseText.length
      const event = createProgressEvent('loadend', responseLength, responseLength, true)
      instance.onloadend.call(instance as unknown as XMLHttpRequest, event)
    }
  }

  const getRequests = () => [...requests]

  const getLastRequest = () => requests[requests.length - 1]

  const getInstances = () => [...instances]

  const getLastInstance = () => instances[instances.length - 1]

  const respondWith = (response: Partial<MockXHRResponse>) => {
    const instance = getLastInstance()
    if (instance) {
      respondToInstance(instance, response)
    }
  }

  const respondToRequest = (index: number, response: Partial<MockXHRResponse>) => {
    const instance = instances[index]
    if (instance) {
      respondToInstance(instance, response)
    }
  }

  const triggerProgress = (loaded: number, total: number, lengthComputable: boolean = true) => {
    const instance = getLastInstance()
    if (instance?.onprogress) {
      const event = createProgressEvent('progress', loaded, total, lengthComputable)
      instance.onprogress.call(instance as unknown as XMLHttpRequest, event)
    }
  }

  const triggerUploadProgress = (loaded: number, total: number, lengthComputable: boolean = true) => {
    const instance = getLastInstance()
    if (instance?.upload.onprogress) {
      const event = createProgressEvent('progress', loaded, total, lengthComputable)
      instance.upload.onprogress.call(instance.upload as unknown as XMLHttpRequestUpload, event)
    }
  }

  const triggerError = (message: string = 'Network error') => {
    const instance = getLastInstance()
    if (instance) {
      instance.readyState = 4

      if (instance.onreadystatechange) {
        instance.onreadystatechange.call(
          instance as unknown as XMLHttpRequest,
          new Event('readystatechange')
        )
      }

      if (instance.onerror) {
        const event = createProgressEvent('error', 0, 0, false)
        instance.onerror.call(instance as unknown as XMLHttpRequest, event)
      }

      if (instance.onloadend) {
        const event = createProgressEvent('loadend', 0, 0, false)
        instance.onloadend.call(instance as unknown as XMLHttpRequest, event)
      }
    }
  }

  const triggerTimeout = () => {
    const instance = getLastInstance()
    if (instance) {
      instance.readyState = 4

      if (instance.onreadystatechange) {
        instance.onreadystatechange.call(
          instance as unknown as XMLHttpRequest,
          new Event('readystatechange')
        )
      }

      if (instance.ontimeout) {
        const event = createProgressEvent('timeout', 0, 0, false)
        instance.ontimeout.call(instance as unknown as XMLHttpRequest, event)
      }

      if (instance.onloadend) {
        const event = createProgressEvent('loadend', 0, 0, false)
        instance.onloadend.call(instance as unknown as XMLHttpRequest, event)
      }
    }
  }

  const triggerAbort = () => {
    const instance = getLastInstance()
    if (instance) {
      instance.abort()
    }
  }

  const setDefaultResponse = (response: Partial<MockXHRResponse>) => {
    defaultResponse = {
      ...defaultResponse,
      ...response,
    }
  }

  const cleanup = () => {
    // Restore original
    ;(window as unknown as Record<string, unknown>).XMLHttpRequest = originalXHR

    // Clear all data
    requests.length = 0
    instances.length = 0
    currentInstance = null

    // Reset default response
    defaultResponse = {
      status: 200,
      statusText: 'OK',
      headers: {},
      responseText: '',
      responseXML: null,
      response: null,
    }

    // Clear all mocks
    mockOpen.mockClear()
    mockSend.mockClear()
    mockSetRequestHeader.mockClear()
    mockAbort.mockClear()
    mockGetAllResponseHeaders.mockClear()
    mockGetResponseHeader.mockClear()
  }

  return {
    mockOpen,
    mockSend,
    mockSetRequestHeader,
    mockAbort,
    mockGetAllResponseHeaders,
    mockGetResponseHeader,
    getRequests,
    getLastRequest,
    getInstances,
    getLastInstance,
    respondWith,
    respondToRequest,
    triggerProgress,
    triggerUploadProgress,
    triggerError,
    triggerTimeout,
    triggerAbort,
    setDefaultResponse,
    cleanup,
  }
}

/**
 * Common HTTP status codes for testing
 */
export const HttpStatus = {
  OK: { status: 200, statusText: 'OK' },
  CREATED: { status: 201, statusText: 'Created' },
  NO_CONTENT: { status: 204, statusText: 'No Content' },
  BAD_REQUEST: { status: 400, statusText: 'Bad Request' },
  UNAUTHORIZED: { status: 401, statusText: 'Unauthorized' },
  FORBIDDEN: { status: 403, statusText: 'Forbidden' },
  NOT_FOUND: { status: 404, statusText: 'Not Found' },
  METHOD_NOT_ALLOWED: { status: 405, statusText: 'Method Not Allowed' },
  CONFLICT: { status: 409, statusText: 'Conflict' },
  UNPROCESSABLE_ENTITY: { status: 422, statusText: 'Unprocessable Entity' },
  TOO_MANY_REQUESTS: { status: 429, statusText: 'Too Many Requests' },
  INTERNAL_SERVER_ERROR: { status: 500, statusText: 'Internal Server Error' },
  BAD_GATEWAY: { status: 502, statusText: 'Bad Gateway' },
  SERVICE_UNAVAILABLE: { status: 503, statusText: 'Service Unavailable' },
  GATEWAY_TIMEOUT: { status: 504, statusText: 'Gateway Timeout' },
} as const

/**
 * XMLHttpRequest readyState values
 */
export const ReadyState = {
  UNSENT: 0,
  OPENED: 1,
  HEADERS_RECEIVED: 2,
  LOADING: 3,
  DONE: 4,
} as const
