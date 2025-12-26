/**
 * MockSpeechRecognition - Mock Web Speech API for testing
 *
 * Simulates speech recognition without actual microphone access
 */

export interface MockSpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

export interface MockSpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  grammars: any
  onstart: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onaudiostart: ((event: Event) => void) | null
  onaudioend: ((event: Event) => void) | null
  onspeechstart: ((event: Event) => void) | null
  onspeechend: ((event: Event) => void) | null
  onsoundstart: ((event: Event) => void) | null
  onsoundend: ((event: Event) => void) | null
  onnomatch: ((event: Event) => void) | null
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  abort: ReturnType<typeof vi.fn>
}

export interface MockSpeechRecognitionReturn {
  instances: MockSpeechRecognitionInstance[]
  getLastInstance: () => MockSpeechRecognitionInstance | undefined
  triggerResult: (results: MockSpeechRecognitionResult[], instance?: MockSpeechRecognitionInstance) => void
  triggerInterimResult: (transcript: string, instance?: MockSpeechRecognitionInstance) => void
  triggerError: (error: string, instance?: MockSpeechRecognitionInstance) => void
  triggerEnd: (instance?: MockSpeechRecognitionInstance) => void
  simulateSpeech: (transcript: string, instance?: MockSpeechRecognitionInstance) => void
  cleanup: () => void
}

/**
 * Sets up mock for SpeechRecognition API
 *
 * @example
 * ```typescript
 * import { setupMockSpeechRecognition } from '@ux.qa/frontmock'
 *
 * const { getLastInstance, simulateSpeech, cleanup } = setupMockSpeechRecognition()
 *
 * render(<VoiceSearchComponent />)
 *
 * // User clicks microphone button
 * await user.click(screen.getByRole('button', { name: /voice search/i }))
 *
 * const recognition = getLastInstance()
 * expect(recognition?.start).toHaveBeenCalled()
 *
 * // Simulate user speaking
 * simulateSpeech('search for restaurants nearby')
 *
 * // Verify search was performed
 * expect(screen.getByDisplayValue('search for restaurants nearby')).toBeInTheDocument()
 *
 * cleanup()
 * ```
 */
export function setupMockSpeechRecognition(): MockSpeechRecognitionReturn {
  const instances: MockSpeechRecognitionInstance[] = []
  let isListening = false

  class MockSpeechRecognitionClass {
    lang: string = 'en-US'
    continuous: boolean = false
    interimResults: boolean = false
    maxAlternatives: number = 1
    grammars: any = null

    onstart: ((this: SpeechRecognition, ev: Event) => any) | null = null
    onend: ((this: SpeechRecognition, ev: Event) => any) | null = null
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null = null
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null = null
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null = null
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null = null
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null = null
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null = null
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null = null
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null = null
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null = null

    start = vi.fn(() => {
      if (isListening) {
        const error = createErrorEvent('already-started')
        this.onerror?.(error)
        return
      }
      isListening = true
      this.onstart?.(new Event('start'))
      this.onaudiostart?.(new Event('audiostart'))
    })

    stop = vi.fn(() => {
      if (!isListening) return
      isListening = false
      this.onspeechend?.(new Event('speechend'))
      this.onaudioend?.(new Event('audioend'))
      this.onend?.(new Event('end'))
    })

    abort = vi.fn(() => {
      if (!isListening) return
      isListening = false
      this.onend?.(new Event('end'))
    })

    addEventListener = vi.fn()
    removeEventListener = vi.fn()
    dispatchEvent = vi.fn(() => true)

    constructor() {
      instances.push(this as any)
    }
  }

  // Create error event helper
  const createErrorEvent = (errorType: string): SpeechRecognitionErrorEvent => {
    const event = new Event('error') as SpeechRecognitionErrorEvent
    ;(event as any).error = errorType
    ;(event as any).message = `Speech recognition error: ${errorType}`
    return event
  }

  // Create result event helper
  const createResultEvent = (
    results: MockSpeechRecognitionResult[]
  ): SpeechRecognitionEvent => {
    const resultList: SpeechRecognitionResultList = {
      length: results.length,
      item: (index: number) => resultList[index],
    } as SpeechRecognitionResultList

    results.forEach((result, index) => {
      const alternative: SpeechRecognitionAlternative = {
        transcript: result.transcript,
        confidence: result.confidence,
      }

      const speechResult: SpeechRecognitionResult = {
        isFinal: result.isFinal,
        length: 1,
        item: () => alternative,
        0: alternative,
      } as SpeechRecognitionResult

      ;(resultList as any)[index] = speechResult
    })

    const event = new Event('result') as SpeechRecognitionEvent
    ;(event as any).results = resultList
    ;(event as any).resultIndex = 0
    return event
  }

  const originalSpeechRecognition = (global as any).SpeechRecognition
  const originalWebkitSpeechRecognition = (global as any).webkitSpeechRecognition

  // Install mock (both standard and webkit prefixed)
  ;(global as any).SpeechRecognition = MockSpeechRecognitionClass
  ;(global as any).webkitSpeechRecognition = MockSpeechRecognitionClass

  const getLastInstance = () => {
    return instances[instances.length - 1]
  }

  const triggerResult = (
    results: MockSpeechRecognitionResult[],
    instance?: MockSpeechRecognitionInstance
  ) => {
    const recognition = instance ?? getLastInstance()
    if (!recognition) {
      throw new Error('No SpeechRecognition instance found')
    }

    const event = createResultEvent(results)
    recognition.onresult?.(event)
  }

  const triggerInterimResult = (transcript: string, instance?: MockSpeechRecognitionInstance) => {
    const recognition = instance ?? getLastInstance()
    if (!recognition) {
      throw new Error('No SpeechRecognition instance found')
    }

    triggerResult(
      [{ transcript, confidence: 0.8, isFinal: false }],
      recognition
    )
  }

  const triggerError = (error: string, instance?: MockSpeechRecognitionInstance) => {
    const recognition = instance ?? getLastInstance()
    if (!recognition) {
      throw new Error('No SpeechRecognition instance found')
    }

    const event = createErrorEvent(error)
    recognition.onerror?.(event)
  }

  const triggerEnd = (instance?: MockSpeechRecognitionInstance) => {
    const recognition = instance ?? getLastInstance()
    if (!recognition) {
      throw new Error('No SpeechRecognition instance found')
    }

    isListening = false
    recognition.onend?.(new Event('end'))
  }

  const simulateSpeech = (transcript: string, instance?: MockSpeechRecognitionInstance) => {
    const recognition = instance ?? getLastInstance()
    if (!recognition) {
      throw new Error('No SpeechRecognition instance found')
    }

    // Simulate full speech flow
    recognition.onsoundstart?.(new Event('soundstart'))
    recognition.onspeechstart?.(new Event('speechstart'))

    // Trigger interim results if enabled
    if (recognition.interimResults) {
      const words = transcript.split(' ')
      let partial = ''
      words.forEach((word) => {
        partial += (partial ? ' ' : '') + word
        triggerInterimResult(partial, recognition)
      })
    }

    // Final result
    triggerResult(
      [{ transcript, confidence: 0.95, isFinal: true }],
      recognition
    )

    recognition.onspeechend?.(new Event('speechend'))
    recognition.onsoundend?.(new Event('soundend'))

    // End if not continuous
    if (!recognition.continuous) {
      triggerEnd(recognition)
    }
  }

  const cleanup = () => {
    isListening = false
    instances.length = 0

    // Restore originals
    ;(global as any).SpeechRecognition = originalSpeechRecognition
    ;(global as any).webkitSpeechRecognition = originalWebkitSpeechRecognition
  }

  return {
    instances,
    getLastInstance,
    triggerResult,
    triggerInterimResult,
    triggerError,
    triggerEnd,
    simulateSpeech,
    cleanup,
  }
}

/**
 * Speech recognition error types
 */
export const SpeechRecognitionErrorType = {
  NO_SPEECH: 'no-speech',
  ABORTED: 'aborted',
  AUDIO_CAPTURE: 'audio-capture',
  NETWORK: 'network',
  NOT_ALLOWED: 'not-allowed',
  SERVICE_NOT_ALLOWED: 'service-not-allowed',
  BAD_GRAMMAR: 'bad-grammar',
  LANGUAGE_NOT_SUPPORTED: 'language-not-supported',
} as const

/**
 * Common language codes for speech recognition
 */
export const SpeechLanguage = {
  EN_US: 'en-US',
  EN_GB: 'en-GB',
  ES_ES: 'es-ES',
  FR_FR: 'fr-FR',
  DE_DE: 'de-DE',
  IT_IT: 'it-IT',
  PT_BR: 'pt-BR',
  JA_JP: 'ja-JP',
  ZH_CN: 'zh-CN',
  KO_KR: 'ko-KR',
} as const
