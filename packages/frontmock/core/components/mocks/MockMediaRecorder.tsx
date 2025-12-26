/**
 * MockMediaRecorder - Mock MediaRecorder API for testing
 *
 * Simulates audio/video recording without actual media capture
 */

export interface MockMediaRecorderInstance {
  stream: MediaStream
  state: RecordingState
  mimeType: string
  ondataavailable: ((event: BlobEvent) => void) | null
  onstart: ((event: Event) => void) | null
  onstop: ((event: Event) => void) | null
  onpause: ((event: Event) => void) | null
  onresume: ((event: Event) => void) | null
  onerror: ((event: Event) => void) | null
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  pause: ReturnType<typeof vi.fn>
  resume: ReturnType<typeof vi.fn>
  requestData: ReturnType<typeof vi.fn>
}

export interface MockMediaRecorderReturn {
  instances: MockMediaRecorderInstance[]
  getLastInstance: () => MockMediaRecorderInstance | undefined
  triggerDataAvailable: (data: Blob, instance?: MockMediaRecorderInstance) => void
  triggerError: (error: Error, instance?: MockMediaRecorderInstance) => void
  isTypeSupported: ReturnType<typeof vi.fn>
  cleanup: () => void
}

/**
 * Sets up mock for MediaRecorder API
 *
 * @example
 * ```typescript
 * import { setupMockMediaRecorder } from '@ux.qa/frontmock'
 *
 * const { getLastInstance, triggerDataAvailable, cleanup } = setupMockMediaRecorder()
 *
 * render(<VoiceRecorderComponent />)
 *
 * // User clicks record button
 * await user.click(screen.getByRole('button', { name: /record/i }))
 *
 * const recorder = getLastInstance()
 * expect(recorder?.state).toBe('recording')
 *
 * // Simulate recorded data becoming available
 * const audioBlob = new Blob(['mock audio'], { type: 'audio/webm' })
 * triggerDataAvailable(audioBlob)
 *
 * // User clicks stop
 * await user.click(screen.getByRole('button', { name: /stop/i }))
 *
 * // Verify recording is displayed
 * expect(screen.getByText('Recording saved')).toBeInTheDocument()
 *
 * cleanup()
 * ```
 */
export function setupMockMediaRecorder(): MockMediaRecorderReturn {
  const instances: MockMediaRecorderInstance[] = []
  const recordedChunks = new Map<MockMediaRecorderInstance, Blob[]>()

  const isTypeSupported = vi.fn((mimeType: string): boolean => {
    const supportedTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'video/webm',
      'video/webm;codecs=vp8',
      'video/webm;codecs=vp9',
      'video/mp4',
    ]
    return supportedTypes.some((t) => mimeType.startsWith(t.split(';')[0]))
  })

  class MockMediaRecorderClass implements MediaRecorder {
    stream: MediaStream
    state: RecordingState = 'inactive'
    mimeType: string
    audioBitsPerSecond: number = 128000
    videoBitsPerSecond: number = 2500000
    audioBitrateMode: BitrateMode = 'variable'

    ondataavailable: ((this: MediaRecorder, ev: BlobEvent) => any) | null = null
    onstart: ((this: MediaRecorder, ev: Event) => any) | null = null
    onstop: ((this: MediaRecorder, ev: Event) => any) | null = null
    onpause: ((this: MediaRecorder, ev: Event) => any) | null = null
    onresume: ((this: MediaRecorder, ev: Event) => any) | null = null
    onerror: ((this: MediaRecorder, ev: Event) => any) | null = null

    start = vi.fn((timeslice?: number) => {
      if (this.state !== 'inactive') {
        throw new Error('MediaRecorder is not inactive')
      }
      this.state = 'recording'
      this.onstart?.(new Event('start'))

      // If timeslice provided, simulate periodic data events
      if (timeslice && timeslice > 0) {
        // In real implementation would set up interval
      }
    })

    stop = vi.fn(() => {
      if (this.state === 'inactive') {
        throw new Error('MediaRecorder is not active')
      }
      this.state = 'inactive'

      // Trigger final data available
      const chunks = recordedChunks.get(this as any) || []
      if (chunks.length > 0) {
        const finalBlob = new Blob(chunks, { type: this.mimeType })
        const event = new BlobEvent('dataavailable', { data: finalBlob })
        this.ondataavailable?.(event)
      }

      this.onstop?.(new Event('stop'))
    })

    pause = vi.fn(() => {
      if (this.state !== 'recording') {
        throw new Error('MediaRecorder is not recording')
      }
      this.state = 'paused'
      this.onpause?.(new Event('pause'))
    })

    resume = vi.fn(() => {
      if (this.state !== 'paused') {
        throw new Error('MediaRecorder is not paused')
      }
      this.state = 'recording'
      this.onresume?.(new Event('resume'))
    })

    requestData = vi.fn(() => {
      if (this.state === 'inactive') {
        throw new Error('MediaRecorder is not active')
      }
      const chunks = recordedChunks.get(this as any) || []
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: this.mimeType })
        const event = new BlobEvent('dataavailable', { data: blob })
        this.ondataavailable?.(event)
      }
    })

    addEventListener = vi.fn()
    removeEventListener = vi.fn()
    dispatchEvent = vi.fn(() => true)

    static isTypeSupported = isTypeSupported

    constructor(stream: MediaStream, options?: MediaRecorderOptions) {
      this.stream = stream
      this.mimeType = options?.mimeType || 'video/webm'

      if (options?.audioBitsPerSecond) {
        this.audioBitsPerSecond = options.audioBitsPerSecond
      }
      if (options?.videoBitsPerSecond) {
        this.videoBitsPerSecond = options.videoBitsPerSecond
      }

      instances.push(this as any)
      recordedChunks.set(this as any, [])
    }
  }

  const originalMediaRecorder = global.MediaRecorder

  // Install mock
  global.MediaRecorder = MockMediaRecorderClass as any

  const getLastInstance = () => {
    return instances[instances.length - 1]
  }

  const triggerDataAvailable = (data: Blob, instance?: MockMediaRecorderInstance) => {
    const recorder = instance ?? getLastInstance()
    if (!recorder) {
      throw new Error('No MediaRecorder instance found')
    }

    // Store chunk
    if (!recordedChunks.has(recorder)) {
      recordedChunks.set(recorder, [])
    }
    recordedChunks.get(recorder)!.push(data)

    const event = new BlobEvent('dataavailable', { data })
    recorder.ondataavailable?.(event)
  }

  const triggerError = (error: Error, instance?: MockMediaRecorderInstance) => {
    const recorder = instance ?? getLastInstance()
    if (!recorder) {
      throw new Error('No MediaRecorder instance found')
    }

    const event = new Event('error')
    ;(event as any).error = error
    recorder.onerror?.(event)
  }

  const cleanup = () => {
    // Stop all recorders
    instances.forEach((r) => {
      if (r.state !== 'inactive') {
        r.state = 'inactive'
      }
    })
    instances.length = 0
    recordedChunks.clear()

    // Restore original
    global.MediaRecorder = originalMediaRecorder
  }

  return {
    instances,
    getLastInstance,
    triggerDataAvailable,
    triggerError,
    isTypeSupported,
    cleanup,
  }
}

/**
 * Recording states for convenience
 */
export const RecorderState = {
  INACTIVE: 'inactive',
  RECORDING: 'recording',
  PAUSED: 'paused',
} as const

/**
 * Common MIME types for recording
 */
export const RecorderMimeType = {
  WEBM_VIDEO: 'video/webm',
  WEBM_VP8: 'video/webm;codecs=vp8',
  WEBM_VP9: 'video/webm;codecs=vp9',
  WEBM_AUDIO: 'audio/webm',
  WEBM_OPUS: 'audio/webm;codecs=opus',
  MP4_VIDEO: 'video/mp4',
  MP4_AUDIO: 'audio/mp4',
  OGG_AUDIO: 'audio/ogg',
} as const

/**
 * BlobEvent polyfill for environments that don't support it
 */
class BlobEvent extends Event {
  readonly data: Blob
  readonly timecode: number

  constructor(type: string, eventInitDict: { data: Blob; timecode?: number }) {
    super(type)
    this.data = eventInitDict.data
    this.timecode = eventInitDict.timecode ?? 0
  }
}

// Ensure BlobEvent is available globally
if (typeof global.BlobEvent === 'undefined') {
  global.BlobEvent = BlobEvent as any
}
