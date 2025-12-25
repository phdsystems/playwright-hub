/**
 * MockFileReader - Mock FileReader API for testing file uploads
 *
 * Simulates file reading without actual file I/O
 */

export interface MockFileReaderReturn {
  mockReadAsDataURL: ReturnType<typeof vi.fn>
  mockReadAsText: ReturnType<typeof vi.fn>
  mockReadAsArrayBuffer: ReturnType<typeof vi.fn>
  triggerLoad: (file: File, result: string | ArrayBuffer) => void
  triggerError: (error: Error) => void
  triggerProgress: (loaded: number, total: number) => void
  cleanup: () => void
}

/**
 * Sets up mock for FileReader API
 *
 * @example
 * ```typescript
 * import { setupMockFileReader } from '@ux.qa/frontmock'
 *
 * const { triggerLoad, cleanup } = setupMockFileReader()
 *
 * const handleFileUpload = vi.fn()
 * render(<FileUpload onUpload={handleFileUpload} />)
 *
 * // Create test file
 * const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
 *
 * // Upload file
 * const input = screen.getByLabelText('Upload file')
 * await user.upload(input, file)
 *
 * // Trigger successful load
 * triggerLoad(file, 'data:text/plain;base64,dGVzdCBjb250ZW50')
 *
 * // Verify upload handler was called
 * expect(handleFileUpload).toHaveBeenCalled()
 *
 * cleanup()
 * ```
 */
export function setupMockFileReader(): MockFileReaderReturn {
  let currentReader: MockFileReader | null = null

  const mockReadAsDataURL = vi.fn()
  const mockReadAsText = vi.fn()
  const mockReadAsArrayBuffer = vi.fn()

  class MockFileReader implements FileReader {
    DONE = 2 as const
    EMPTY = 0 as const
    LOADING = 1 as const

    readyState: number = 0
    result: string | ArrayBuffer | null = null
    error: DOMException | null = null

    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
    onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
    onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
    onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
    onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null

    constructor() {
      currentReader = this
    }

    readAsDataURL(blob: Blob) {
      mockReadAsDataURL(blob)
      this.readyState = this.LOADING
      this.onloadstart?.(new ProgressEvent('loadstart') as any)
    }

    readAsText(blob: Blob, encoding?: string) {
      mockReadAsText(blob, encoding)
      this.readyState = this.LOADING
      this.onloadstart?.(new ProgressEvent('loadstart') as any)
    }

    readAsArrayBuffer(blob: Blob) {
      mockReadAsArrayBuffer(blob)
      this.readyState = this.LOADING
      this.onloadstart?.(new ProgressEvent('loadstart') as any)
    }

    readAsBinaryString(blob: Blob) {
      this.readyState = this.LOADING
      this.onloadstart?.(new ProgressEvent('loadstart') as any)
    }

    abort() {
      this.readyState = this.DONE
      this.onabort?.(new ProgressEvent('abort') as any)
    }

    addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
      // Mock implementation
    }

    removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
      // Mock implementation
    }

    dispatchEvent(event: Event): boolean {
      return true
    }
  }

  const triggerLoad = (file: File, result: string | ArrayBuffer) => {
    if (!currentReader) {
      throw new Error('No FileReader instance found. Did you call readAsDataURL/readAsText/readAsArrayBuffer?')
    }

    currentReader.result = result
    currentReader.readyState = currentReader.DONE

    const event = new ProgressEvent('load', {
      lengthComputable: true,
      loaded: file.size,
      total: file.size,
    })

    currentReader.onload?.(event as any)
    currentReader.onloadend?.(event as any)
  }

  const triggerError = (error: Error) => {
    if (!currentReader) {
      throw new Error('No FileReader instance found')
    }

    currentReader.error = new DOMException(error.message)
    currentReader.readyState = currentReader.DONE

    const event = new ProgressEvent('error')
    currentReader.onerror?.(event as any)
    currentReader.onloadend?.(event as any)
  }

  const triggerProgress = (loaded: number, total: number) => {
    if (!currentReader) {
      throw new Error('No FileReader instance found')
    }

    const event = new ProgressEvent('progress', {
      lengthComputable: true,
      loaded,
      total,
    })

    currentReader.onprogress?.(event as any)
  }

  const originalFileReader = global.FileReader

  // Install mock
  global.FileReader = MockFileReader as any

  const cleanup = () => {
    // Restore original
    global.FileReader = originalFileReader
    currentReader = null
    mockReadAsDataURL.mockClear()
    mockReadAsText.mockClear()
    mockReadAsArrayBuffer.mockClear()
  }

  return {
    mockReadAsDataURL,
    mockReadAsText,
    mockReadAsArrayBuffer,
    triggerLoad,
    triggerError,
    triggerProgress,
    cleanup,
  }
}

/**
 * Helper to create mock File objects for testing
 *
 * @example
 * ```typescript
 * const imageFile = createMockFile('image.png', 'image/png', 1024)
 * const textFile = createMockFile('doc.txt', 'text/plain', 512)
 * ```
 */
export function createMockFile(
  name: string,
  type: string,
  size: number = 1024,
  content: string = ''
): File {
  const blob = new Blob([content], { type })
  const file = new File([blob], name, { type })

  // Override size if needed
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  })

  return file
}

/**
 * Common file types for testing
 */
export const mockFileTypes = {
  image: {
    png: 'image/png',
    jpg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
  },
  document: {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
  },
  video: {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
  },
  audio: {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
  },
} as const
