/**
 * MockFontAccess - Mock Local Font Access API for testing
 *
 * Allows testing font-based features without actual system font access
 */

export interface FontData {
  family: string
  fullName: string
  postscriptName: string
  style: string
  blob: () => Promise<Blob>
}

export type PermissionState = 'prompt' | 'granted' | 'denied'

export interface MockFontAccessReturn {
  mockQuery: ReturnType<typeof vi.fn>
  addFont: (fontData: Partial<FontData> & { family: string }) => void
  removeFont: (family: string) => void
  setPermission: (state: PermissionState) => void
  getPermission: () => PermissionState
  getFonts: () => FontData[]
  clearFonts: () => void
  cleanup: () => void
}

/**
 * Creates a FontData object with sensible defaults
 */
function createFontData(partial: Partial<FontData> & { family: string }): FontData {
  const family = partial.family
  const style = partial.style ?? 'Regular'

  return {
    family,
    fullName: partial.fullName ?? `${family} ${style}`,
    postscriptName: partial.postscriptName ?? `${family.replace(/\s+/g, '')}-${style}`,
    style,
    blob: partial.blob ?? (() => Promise.resolve(new Blob(['mock-font-data'], { type: 'font/ttf' }))),
  }
}

/**
 * Creates an async iterator from an array of FontData
 */
function createFontIterator(fonts: FontData[]): AsyncIterableIterator<FontData> {
  let index = 0

  return {
    async next(): Promise<IteratorResult<FontData>> {
      if (index < fonts.length) {
        return { value: fonts[index++], done: false }
      }
      return { value: undefined as unknown as FontData, done: true }
    },
    [Symbol.asyncIterator]() {
      return this
    },
  }
}

/**
 * Sets up mock for Local Font Access API (navigator.fonts)
 *
 * @example
 * ```typescript
 * import { setupMockFontAccess, SystemFontPresets } from '@ux.qa/frontmock'
 *
 * const { addFont, setPermission, cleanup } = setupMockFontAccess()
 *
 * // Add system font presets
 * SystemFontPresets.common.forEach(font => addFont(font))
 *
 * // Grant permission
 * setPermission('granted')
 *
 * render(<FontPickerComponent />)
 *
 * // Query fonts in component
 * const fonts = await navigator.fonts.query()
 * for await (const font of fonts) {
 *   console.log(font.family) // "Arial", "Times New Roman", etc.
 * }
 *
 * cleanup()
 * ```
 *
 * @example
 * ```typescript
 * // Testing permission denied scenario
 * const { setPermission, cleanup } = setupMockFontAccess()
 *
 * setPermission('denied')
 *
 * render(<FontPickerComponent />)
 *
 * // Component should show permission error
 * expect(screen.getByText(/permission denied/i)).toBeInTheDocument()
 *
 * cleanup()
 * ```
 */
export function setupMockFontAccess(): MockFontAccessReturn {
  const registeredFonts: FontData[] = []
  let permissionState: PermissionState = 'prompt'

  const mockQuery = vi.fn(
    async (options?: { postscriptNames?: string[] }): Promise<AsyncIterableIterator<FontData>> => {
      // Check permission state
      if (permissionState === 'denied') {
        throw new DOMException('Permission denied', 'NotAllowedError')
      }

      if (permissionState === 'prompt') {
        // In real API, this would trigger a permission prompt
        // For testing, we simulate denied by default when in prompt state
        throw new DOMException('Permission not granted', 'NotAllowedError')
      }

      // Filter fonts if postscriptNames provided
      let fonts = registeredFonts
      if (options?.postscriptNames && options.postscriptNames.length > 0) {
        fonts = registeredFonts.filter((font) =>
          options.postscriptNames!.includes(font.postscriptName)
        )
      }

      return createFontIterator([...fonts])
    }
  )

  const mockFonts = {
    query: mockQuery,
  }

  // Save original navigator.fonts (may not exist)
  const originalFonts = (navigator as unknown as { fonts?: typeof mockFonts }).fonts
  const hasOriginalFonts = 'fonts' in navigator

  // Install mock
  Object.defineProperty(navigator, 'fonts', {
    writable: true,
    configurable: true,
    value: mockFonts,
  })

  const addFont = (fontData: Partial<FontData> & { family: string }) => {
    const font = createFontData(fontData)
    // Avoid duplicates by family + style
    const existingIndex = registeredFonts.findIndex(
      (f) => f.family === font.family && f.style === font.style
    )
    if (existingIndex >= 0) {
      registeredFonts[existingIndex] = font
    } else {
      registeredFonts.push(font)
    }
  }

  const removeFont = (family: string) => {
    const index = registeredFonts.findIndex((f) => f.family === family)
    if (index >= 0) {
      registeredFonts.splice(index, 1)
    }
  }

  const setPermission = (state: PermissionState) => {
    permissionState = state
  }

  const getPermission = () => {
    return permissionState
  }

  const getFonts = () => {
    return [...registeredFonts]
  }

  const clearFonts = () => {
    registeredFonts.length = 0
  }

  const cleanup = () => {
    // Restore original
    if (hasOriginalFonts) {
      Object.defineProperty(navigator, 'fonts', {
        writable: true,
        configurable: true,
        value: originalFonts,
      })
    } else {
      delete (navigator as unknown as { fonts?: typeof mockFonts }).fonts
    }
    registeredFonts.length = 0
    permissionState = 'prompt'
    mockQuery.mockClear()
  }

  return {
    mockQuery,
    addFont,
    removeFont,
    setPermission,
    getPermission,
    getFonts,
    clearFonts,
    cleanup,
  }
}

/**
 * Common system font presets for testing
 */
export const SystemFontPresets = {
  /** Common cross-platform fonts */
  common: [
    { family: 'Arial', style: 'Regular' },
    { family: 'Arial', style: 'Bold' },
    { family: 'Arial', style: 'Italic' },
    { family: 'Times New Roman', style: 'Regular' },
    { family: 'Times New Roman', style: 'Bold' },
    { family: 'Times New Roman', style: 'Italic' },
    { family: 'Helvetica', style: 'Regular' },
    { family: 'Helvetica', style: 'Bold' },
    { family: 'Georgia', style: 'Regular' },
    { family: 'Georgia', style: 'Bold' },
    { family: 'Verdana', style: 'Regular' },
    { family: 'Verdana', style: 'Bold' },
    { family: 'Courier New', style: 'Regular' },
    { family: 'Courier New', style: 'Bold' },
  ] as const,

  /** macOS-specific fonts */
  macos: [
    { family: 'San Francisco', style: 'Regular' },
    { family: 'San Francisco', style: 'Bold' },
    { family: 'SF Pro', style: 'Regular' },
    { family: 'SF Pro', style: 'Bold' },
    { family: 'SF Mono', style: 'Regular' },
    { family: 'Helvetica Neue', style: 'Regular' },
    { family: 'Helvetica Neue', style: 'Bold' },
    { family: 'Avenir', style: 'Regular' },
    { family: 'Avenir', style: 'Bold' },
    { family: 'Menlo', style: 'Regular' },
  ] as const,

  /** Windows-specific fonts */
  windows: [
    { family: 'Segoe UI', style: 'Regular' },
    { family: 'Segoe UI', style: 'Bold' },
    { family: 'Segoe UI', style: 'Semibold' },
    { family: 'Calibri', style: 'Regular' },
    { family: 'Calibri', style: 'Bold' },
    { family: 'Consolas', style: 'Regular' },
    { family: 'Cambria', style: 'Regular' },
    { family: 'Tahoma', style: 'Regular' },
    { family: 'Trebuchet MS', style: 'Regular' },
  ] as const,

  /** Common monospace fonts for code editors */
  monospace: [
    { family: 'Courier New', style: 'Regular' },
    { family: 'Consolas', style: 'Regular' },
    { family: 'Monaco', style: 'Regular' },
    { family: 'Menlo', style: 'Regular' },
    { family: 'SF Mono', style: 'Regular' },
    { family: 'Fira Code', style: 'Regular' },
    { family: 'JetBrains Mono', style: 'Regular' },
    { family: 'Source Code Pro', style: 'Regular' },
  ] as const,

  /** Serif fonts for document editing */
  serif: [
    { family: 'Times New Roman', style: 'Regular' },
    { family: 'Times New Roman', style: 'Bold' },
    { family: 'Georgia', style: 'Regular' },
    { family: 'Georgia', style: 'Bold' },
    { family: 'Cambria', style: 'Regular' },
    { family: 'Palatino', style: 'Regular' },
    { family: 'Book Antiqua', style: 'Regular' },
    { family: 'Garamond', style: 'Regular' },
  ] as const,

  /** Sans-serif fonts for UI */
  sansSerif: [
    { family: 'Arial', style: 'Regular' },
    { family: 'Arial', style: 'Bold' },
    { family: 'Helvetica', style: 'Regular' },
    { family: 'Helvetica', style: 'Bold' },
    { family: 'Verdana', style: 'Regular' },
    { family: 'Segoe UI', style: 'Regular' },
    { family: 'Roboto', style: 'Regular' },
    { family: 'Open Sans', style: 'Regular' },
  ] as const,
} as const

/**
 * Permission state constants
 */
export const FontAccessPermission = {
  PROMPT: 'prompt' as PermissionState,
  GRANTED: 'granted' as PermissionState,
  DENIED: 'denied' as PermissionState,
} as const
