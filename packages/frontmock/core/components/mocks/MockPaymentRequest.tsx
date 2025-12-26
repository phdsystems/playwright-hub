/**
 * MockPaymentRequest - Mock Payment Request API for testing
 *
 * Allows testing payment flows without actual payment processing
 */

export interface MockPaymentMethodData {
  supportedMethods: string
  data?: Record<string, unknown>
}

export interface MockPaymentDetailsInit {
  id?: string
  total: {
    label: string
    amount: { currency: string; value: string }
  }
  displayItems?: Array<{
    label: string
    amount: { currency: string; value: string }
  }>
  shippingOptions?: Array<{
    id: string
    label: string
    amount: { currency: string; value: string }
    selected?: boolean
  }>
  modifiers?: Array<{
    supportedMethods: string
    total?: { label: string; amount: { currency: string; value: string } }
    additionalDisplayItems?: Array<{
      label: string
      amount: { currency: string; value: string }
    }>
    data?: Record<string, unknown>
  }>
}

export interface MockPaymentOptions {
  requestPayerName?: boolean
  requestPayerEmail?: boolean
  requestPayerPhone?: boolean
  requestShipping?: boolean
  shippingType?: 'shipping' | 'delivery' | 'pickup'
}

export interface MockPaymentResponseData {
  requestId: string
  methodName: string
  details: Record<string, unknown>
  shippingAddress?: PaymentAddress | null
  shippingOption?: string | null
  payerName?: string | null
  payerEmail?: string | null
  payerPhone?: string | null
}

export interface TrackedPaymentRequest {
  methodData: MockPaymentMethodData[]
  details: MockPaymentDetailsInit
  options?: MockPaymentOptions
  timestamp: number
}

export interface MockPaymentRequestReturn {
  mockPaymentRequest: ReturnType<typeof vi.fn>
  mockCanMakePayment: ReturnType<typeof vi.fn>
  mockShow: ReturnType<typeof vi.fn>
  mockAbort: ReturnType<typeof vi.fn>
  mockComplete: ReturnType<typeof vi.fn>
  setCanMakePayment: (canPay: boolean) => void
  setPaymentResponse: (response: Partial<MockPaymentResponseData>) => void
  simulateUserAccept: (response?: Partial<MockPaymentResponseData>) => void
  simulateUserReject: (reason?: string) => void
  simulatePaymentMethodChange: (methodName: string, methodDetails?: Record<string, unknown>) => void
  simulateShippingAddressChange: (address: Partial<PaymentAddress>) => void
  getTrackedRequests: () => TrackedPaymentRequest[]
  clearTrackedRequests: () => void
  cleanup: () => void
}

/**
 * Sets up mock for Payment Request API
 *
 * @example
 * ```typescript
 * import { setupMockPaymentRequest, PaymentMethodPresets } from '@ux.qa/frontmock'
 *
 * const {
 *   setCanMakePayment,
 *   simulateUserAccept,
 *   simulateUserReject,
 *   getTrackedRequests,
 *   cleanup
 * } = setupMockPaymentRequest()
 *
 * render(<CheckoutButton />)
 *
 * // Enable payment capability
 * setCanMakePayment(true)
 *
 * // Trigger checkout
 * await userEvent.click(screen.getByRole('button', { name: /pay/i }))
 *
 * // Verify payment request was created
 * const requests = getTrackedRequests()
 * expect(requests).toHaveLength(1)
 * expect(requests[0].details.total.amount.value).toBe('99.99')
 *
 * // Simulate user accepting payment
 * simulateUserAccept({
 *   methodName: 'basic-card',
 *   details: { cardNumber: '****1234' }
 * })
 *
 * // Verify success message
 * expect(screen.getByText(/payment successful/i)).toBeInTheDocument()
 *
 * cleanup()
 * ```
 *
 * @example
 * ```typescript
 * // Testing payment rejection
 * const { simulateUserReject, cleanup } = setupMockPaymentRequest()
 *
 * render(<CheckoutButton />)
 *
 * await userEvent.click(screen.getByRole('button', { name: /pay/i }))
 *
 * // Simulate user canceling payment
 * simulateUserReject('User cancelled the payment')
 *
 * // Verify cancellation handling
 * expect(screen.getByText(/payment cancelled/i)).toBeInTheDocument()
 *
 * cleanup()
 * ```
 */
export function setupMockPaymentRequest(): MockPaymentRequestReturn {
  const trackedRequests: TrackedPaymentRequest[] = []
  let canMakePaymentResult = true
  let currentPaymentResponse: MockPaymentResponseData = {
    requestId: 'mock-request-id',
    methodName: 'basic-card',
    details: {},
  }

  // Store pending promises for show()
  let pendingShowResolve: ((response: PaymentResponse) => void) | null = null
  let pendingShowReject: ((error: Error) => void) | null = null

  // Event listeners storage
  const eventListeners = new Map<string, Set<EventListener>>()

  // Save original PaymentRequest
  const originalPaymentRequest = typeof window !== 'undefined' ? (window as typeof window & { PaymentRequest?: typeof PaymentRequest }).PaymentRequest : undefined

  const mockComplete = vi.fn((_result?: PaymentComplete): Promise<void> => {
    return Promise.resolve()
  })

  const mockRetry = vi.fn((_errorFields?: PaymentValidationErrors): Promise<void> => {
    return Promise.resolve()
  })

  const createMockPaymentResponse = (data: MockPaymentResponseData): PaymentResponse => {
    const response = {
      requestId: data.requestId,
      methodName: data.methodName,
      details: data.details,
      shippingAddress: data.shippingAddress ?? null,
      shippingOption: data.shippingOption ?? null,
      payerName: data.payerName ?? null,
      payerEmail: data.payerEmail ?? null,
      payerPhone: data.payerPhone ?? null,
      complete: mockComplete,
      retry: mockRetry,
      toJSON: () => ({
        requestId: data.requestId,
        methodName: data.methodName,
        details: data.details,
        shippingAddress: data.shippingAddress ?? null,
        shippingOption: data.shippingOption ?? null,
        payerName: data.payerName ?? null,
        payerEmail: data.payerEmail ?? null,
        payerPhone: data.payerPhone ?? null,
      }),
    }
    return response as PaymentResponse
  }

  const mockCanMakePayment = vi.fn((): Promise<boolean> => {
    return Promise.resolve(canMakePaymentResult)
  })

  const mockShow = vi.fn((_detailsPromise?: PaymentDetailsUpdate | PromiseLike<PaymentDetailsUpdate>): Promise<PaymentResponse> => {
    return new Promise((resolve, reject) => {
      pendingShowResolve = resolve
      pendingShowReject = reject
    })
  })

  const mockAbort = vi.fn((): Promise<void> => {
    if (pendingShowReject) {
      pendingShowReject(new DOMException('The payment request was aborted.', 'AbortError'))
      pendingShowResolve = null
      pendingShowReject = null
    }
    return Promise.resolve()
  })

  const mockPaymentRequest = vi.fn(
    (methodData: MockPaymentMethodData[], details: MockPaymentDetailsInit, options?: MockPaymentOptions) => {
      // Track the request
      trackedRequests.push({
        methodData,
        details,
        options,
        timestamp: Date.now(),
      })

      // Update requestId from details if provided
      if (details.id) {
        currentPaymentResponse.requestId = details.id
      }

      const paymentRequest = {
        id: details.id ?? 'mock-payment-request-id',
        canMakePayment: mockCanMakePayment,
        show: mockShow,
        abort: mockAbort,
        shippingAddress: null as PaymentAddress | null,
        shippingOption: null as string | null,
        shippingType: options?.shippingType ?? null,

        // Event handling
        onpaymentmethodchange: null as ((event: PaymentMethodChangeEvent) => void) | null,
        onshippingaddresschange: null as ((event: PaymentRequestUpdateEvent) => void) | null,
        onshippingoptionchange: null as ((event: PaymentRequestUpdateEvent) => void) | null,
        onmerchantvalidation: null as ((event: MerchantValidationEvent) => void) | null,

        addEventListener: (type: string, listener: EventListener) => {
          if (!eventListeners.has(type)) {
            eventListeners.set(type, new Set())
          }
          eventListeners.get(type)!.add(listener)
        },
        removeEventListener: (type: string, listener: EventListener) => {
          eventListeners.get(type)?.delete(listener)
        },
        dispatchEvent: (event: Event): boolean => {
          const listeners = eventListeners.get(event.type)
          if (listeners) {
            listeners.forEach((listener) => {
              if (typeof listener === 'function') {
                listener(event)
              }
            })
          }
          return true
        },
      }

      return paymentRequest
    }
  )

  // Install mock
  if (typeof window !== 'undefined') {
    (window as typeof window & { PaymentRequest: unknown }).PaymentRequest = mockPaymentRequest as unknown as typeof PaymentRequest
  }

  const setCanMakePayment = (canPay: boolean) => {
    canMakePaymentResult = canPay
  }

  const setPaymentResponse = (response: Partial<MockPaymentResponseData>) => {
    currentPaymentResponse = { ...currentPaymentResponse, ...response }
  }

  const simulateUserAccept = (response?: Partial<MockPaymentResponseData>) => {
    if (response) {
      setPaymentResponse(response)
    }
    if (pendingShowResolve) {
      pendingShowResolve(createMockPaymentResponse(currentPaymentResponse))
      pendingShowResolve = null
      pendingShowReject = null
    }
  }

  const simulateUserReject = (reason?: string) => {
    if (pendingShowReject) {
      pendingShowReject(new DOMException(reason ?? 'User cancelled the payment request.', 'AbortError'))
      pendingShowResolve = null
      pendingShowReject = null
    }
  }

  const simulatePaymentMethodChange = (methodName: string, methodDetails?: Record<string, unknown>) => {
    const event = new Event('paymentmethodchange') as PaymentMethodChangeEvent
    Object.defineProperties(event, {
      methodName: { value: methodName },
      methodDetails: { value: methodDetails ?? {} },
      updateWith: {
        value: vi.fn((_detailsPromise: PaymentDetailsUpdate | Promise<PaymentDetailsUpdate>) => {
          return Promise.resolve()
        }),
      },
    })

    const listeners = eventListeners.get('paymentmethodchange')
    if (listeners) {
      listeners.forEach((listener) => {
        if (typeof listener === 'function') {
          listener(event)
        }
      })
    }
  }

  const simulateShippingAddressChange = (address: Partial<PaymentAddress>) => {
    const event = new Event('shippingaddresschange') as PaymentRequestUpdateEvent
    Object.defineProperty(event, 'updateWith', {
      value: vi.fn((_detailsPromise: PaymentDetailsUpdate | Promise<PaymentDetailsUpdate>) => {
        return Promise.resolve()
      }),
    })

    // Store the address on the payment request instance
    const listeners = eventListeners.get('shippingaddresschange')
    if (listeners) {
      listeners.forEach((listener) => {
        if (typeof listener === 'function') {
          listener(event)
        }
      })
    }
  }

  const getTrackedRequests = () => {
    return [...trackedRequests]
  }

  const clearTrackedRequests = () => {
    trackedRequests.length = 0
  }

  const cleanup = () => {
    // Restore original
    if (typeof window !== 'undefined') {
      if (originalPaymentRequest) {
        (window as typeof window & { PaymentRequest: unknown }).PaymentRequest = originalPaymentRequest
      } else {
        delete (window as typeof window & { PaymentRequest?: unknown }).PaymentRequest
      }
    }

    // Clear pending promises
    if (pendingShowReject) {
      pendingShowReject(new DOMException('Payment request was cleaned up.', 'AbortError'))
    }
    pendingShowResolve = null
    pendingShowReject = null

    // Clear tracked requests
    trackedRequests.length = 0

    // Clear event listeners
    eventListeners.clear()

    // Clear mocks
    mockPaymentRequest.mockClear()
    mockCanMakePayment.mockClear()
    mockShow.mockClear()
    mockAbort.mockClear()
    mockComplete.mockClear()
  }

  return {
    mockPaymentRequest,
    mockCanMakePayment,
    mockShow,
    mockAbort,
    mockComplete,
    setCanMakePayment,
    setPaymentResponse,
    simulateUserAccept,
    simulateUserReject,
    simulatePaymentMethodChange,
    simulateShippingAddressChange,
    getTrackedRequests,
    clearTrackedRequests,
    cleanup,
  }
}

/**
 * Common payment method presets for testing
 */
export const PaymentMethodPresets = {
  basicCard: {
    supportedMethods: 'basic-card',
    data: {
      supportedNetworks: ['visa', 'mastercard', 'amex', 'discover'],
      supportedTypes: ['credit', 'debit'],
    },
  },
  googlePay: {
    supportedMethods: 'https://google.com/pay',
    data: {
      environment: 'TEST',
      apiVersion: 2,
      apiVersionMinor: 0,
      merchantInfo: {
        merchantId: 'test-merchant-id',
        merchantName: 'Test Merchant',
      },
      allowedPaymentMethods: [
        {
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['VISA', 'MASTERCARD'],
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'example',
              gatewayMerchantId: 'exampleMerchantId',
            },
          },
        },
      ],
    },
  },
  applePay: {
    supportedMethods: 'https://apple.com/apple-pay',
    data: {
      version: 3,
      merchantIdentifier: 'merchant.com.example',
      merchantCapabilities: ['supports3DS'],
      supportedNetworks: ['visa', 'masterCard', 'amex'],
      countryCode: 'US',
    },
  },
  paypal: {
    supportedMethods: 'https://www.paypal.com/payment-request',
    data: {
      merchantId: 'test-merchant-id',
    },
  },
} as const

/**
 * Common payment details presets for testing
 */
export const PaymentDetailsPresets = {
  simpleOrder: {
    id: 'order-001',
    total: {
      label: 'Total',
      amount: { currency: 'USD', value: '99.99' },
    },
  },
  orderWithItems: {
    id: 'order-002',
    total: {
      label: 'Total',
      amount: { currency: 'USD', value: '149.97' },
    },
    displayItems: [
      { label: 'Product A', amount: { currency: 'USD', value: '49.99' } },
      { label: 'Product B', amount: { currency: 'USD', value: '79.99' } },
      { label: 'Shipping', amount: { currency: 'USD', value: '9.99' } },
      { label: 'Tax', amount: { currency: 'USD', value: '10.00' } },
    ],
  },
  orderWithShipping: {
    id: 'order-003',
    total: {
      label: 'Total',
      amount: { currency: 'USD', value: '59.98' },
    },
    displayItems: [
      { label: 'Product', amount: { currency: 'USD', value: '49.99' } },
    ],
    shippingOptions: [
      {
        id: 'standard',
        label: 'Standard Shipping (5-7 days)',
        amount: { currency: 'USD', value: '4.99' },
        selected: true,
      },
      {
        id: 'express',
        label: 'Express Shipping (2-3 days)',
        amount: { currency: 'USD', value: '9.99' },
      },
      {
        id: 'overnight',
        label: 'Overnight Shipping',
        amount: { currency: 'USD', value: '19.99' },
      },
    ],
  },
  subscriptionOrder: {
    id: 'subscription-001',
    total: {
      label: 'Monthly Subscription',
      amount: { currency: 'USD', value: '9.99' },
    },
    displayItems: [
      { label: 'Premium Plan (Monthly)', amount: { currency: 'USD', value: '9.99' } },
    ],
  },
} as const

/**
 * Common payment response presets for testing
 */
export const PaymentResponsePresets = {
  successfulCardPayment: {
    requestId: 'request-001',
    methodName: 'basic-card',
    details: {
      cardNumber: '************1234',
      cardholderName: 'John Doe',
      expiryMonth: '12',
      expiryYear: '2025',
      cardSecurityCode: '***',
    },
    payerName: 'John Doe',
    payerEmail: 'john.doe@example.com',
    payerPhone: '+1-555-123-4567',
  },
  successfulGooglePay: {
    requestId: 'request-002',
    methodName: 'https://google.com/pay',
    details: {
      paymentMethodData: {
        type: 'CARD',
        description: 'Visa ****1234',
        info: {
          cardNetwork: 'VISA',
          cardDetails: '1234',
        },
        tokenizationData: {
          type: 'PAYMENT_GATEWAY',
          token: 'mock-encrypted-token',
        },
      },
    },
  },
  successfulApplePay: {
    requestId: 'request-003',
    methodName: 'https://apple.com/apple-pay',
    details: {
      paymentData: {
        version: 'EC_v1',
        data: 'mock-encrypted-payment-data',
        signature: 'mock-signature',
        header: {
          transactionId: 'mock-transaction-id',
          publicKeyHash: 'mock-public-key-hash',
          ephemeralPublicKey: 'mock-ephemeral-key',
        },
      },
    },
  },
} as const

/**
 * Payment error codes and messages
 */
export const PaymentErrorCode = {
  ABORT_ERROR: 'AbortError',
  INVALID_STATE_ERROR: 'InvalidStateError',
  NOT_ALLOWED_ERROR: 'NotAllowedError',
  NOT_SUPPORTED_ERROR: 'NotSupportedError',
  SECURITY_ERROR: 'SecurityError',
} as const

export const PaymentErrorMessages = {
  userCancelled: 'User cancelled the payment request.',
  paymentAborted: 'The payment request was aborted.',
  alreadyShowing: 'A PaymentRequest is already showing.',
  notSupported: 'The payment method is not supported.',
  notSecureContext: 'PaymentRequest requires a secure context.',
} as const
