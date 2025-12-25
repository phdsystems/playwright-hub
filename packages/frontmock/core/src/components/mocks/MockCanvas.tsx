/**
 * MockCanvas - Mock HTMLCanvasElement and 2D context for testing
 *
 * Tracks canvas operations without actual rendering
 */

export interface CanvasOperation {
  method: string
  args: any[]
  timestamp: number
}

export interface MockCanvasReturn {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  operations: CanvasOperation[]
  getOperations: (method?: string) => CanvasOperation[]
  clearOperations: () => void
  cleanup: () => void
}

/**
 * Sets up mock canvas element and 2D context
 *
 * @example
 * ```typescript
 * import { setupMockCanvas } from '@ux.qa/frontmock'
 *
 * const { canvas, context, getOperations, cleanup } = setupMockCanvas()
 *
 * render(<ChartComponent canvas={canvas} />)
 *
 * // Verify canvas operations
 * const fillRectCalls = getOperations('fillRect')
 * expect(fillRectCalls).toHaveLength(3)
 * expect(fillRectCalls[0].args).toEqual([0, 0, 100, 100])
 *
 * // Verify drawing occurred
 * expect(getOperations('stroke')).not.toHaveLength(0)
 *
 * cleanup()
 * ```
 */
export function setupMockCanvas(
  width: number = 800,
  height: number = 600
): MockCanvasReturn {
  const operations: CanvasOperation[] = []

  const trackOperation = (method: string, args: any[]) => {
    operations.push({
      method,
      args: [...args],
      timestamp: Date.now(),
    })
  }

  // Create mock 2D context
  const mockContext: any = {
    canvas: null, // Will be set below

    // State
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    globalAlpha: 1.0,
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',

    // Drawing rectangles
    fillRect: vi.fn((...args) => trackOperation('fillRect', args)),
    strokeRect: vi.fn((...args) => trackOperation('strokeRect', args)),
    clearRect: vi.fn((...args) => trackOperation('clearRect', args)),

    // Drawing paths
    beginPath: vi.fn(() => trackOperation('beginPath', [])),
    closePath: vi.fn(() => trackOperation('closePath', [])),
    moveTo: vi.fn((...args) => trackOperation('moveTo', args)),
    lineTo: vi.fn((...args) => trackOperation('lineTo', args)),
    arc: vi.fn((...args) => trackOperation('arc', args)),
    arcTo: vi.fn((...args) => trackOperation('arcTo', args)),
    quadraticCurveTo: vi.fn((...args) => trackOperation('quadraticCurveTo', args)),
    bezierCurveTo: vi.fn((...args) => trackOperation('bezierCurveTo', args)),
    rect: vi.fn((...args) => trackOperation('rect', args)),

    // Filling and stroking
    fill: vi.fn(() => trackOperation('fill', [])),
    stroke: vi.fn(() => trackOperation('stroke', [])),
    clip: vi.fn(() => trackOperation('clip', [])),

    // Drawing text
    fillText: vi.fn((...args) => trackOperation('fillText', args)),
    strokeText: vi.fn((...args) => trackOperation('strokeText', args)),
    measureText: vi.fn((text) => {
      trackOperation('measureText', [text])
      return { width: text.length * 7 }
    }),

    // Drawing images
    drawImage: vi.fn((...args) => trackOperation('drawImage', args)),

    // Transformations
    scale: vi.fn((...args) => trackOperation('scale', args)),
    rotate: vi.fn((...args) => trackOperation('rotate', args)),
    translate: vi.fn((...args) => trackOperation('translate', args)),
    transform: vi.fn((...args) => trackOperation('transform', args)),
    setTransform: vi.fn((...args) => trackOperation('setTransform', args)),
    resetTransform: vi.fn(() => trackOperation('resetTransform', [])),

    // State management
    save: vi.fn(() => trackOperation('save', [])),
    restore: vi.fn(() => trackOperation('restore', [])),

    // Pixel manipulation
    createImageData: vi.fn((...args) => {
      trackOperation('createImageData', args)
      const [width, height] = args
      return {
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4),
      }
    }),
    getImageData: vi.fn((...args) => {
      trackOperation('getImageData', args)
      const [x, y, width, height] = args
      return {
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4),
      }
    }),
    putImageData: vi.fn((...args) => trackOperation('putImageData', args)),

    // Gradients and patterns
    createLinearGradient: vi.fn((...args) => {
      trackOperation('createLinearGradient', args)
      return {
        addColorStop: vi.fn(),
      }
    }),
    createRadialGradient: vi.fn((...args) => {
      trackOperation('createRadialGradient', args)
      return {
        addColorStop: vi.fn(),
      }
    }),
    createPattern: vi.fn((...args) => {
      trackOperation('createPattern', args)
      return {}
    }),

    // Compositing
    globalCompositeOperation: 'source-over',

    // Image smoothing
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'low',

    // Shadows
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,

    // Filters
    filter: 'none',
  }

  // Create mock canvas element
  const mockCanvas: any = {
    width,
    height,
    style: {},

    getContext: vi.fn((contextType: string) => {
      if (contextType === '2d') {
        return mockContext
      }
      return null
    }),

    toDataURL: vi.fn((type = 'image/png') => {
      trackOperation('toDataURL', [type])
      return `data:${type};base64,mockbase64data`
    }),

    toBlob: vi.fn((callback, type = 'image/png', quality = 0.92) => {
      trackOperation('toBlob', [type, quality])
      const blob = new Blob(['mock blob'], { type })
      callback(blob)
    }),

    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }

  // Link context to canvas
  mockContext.canvas = mockCanvas

  const getOperations = (method?: string) => {
    if (method) {
      return operations.filter((op) => op.method === method)
    }
    return operations
  }

  const clearOperations = () => {
    operations.length = 0
  }

  const cleanup = () => {
    clearOperations()
  }

  return {
    canvas: mockCanvas as HTMLCanvasElement,
    context: mockContext as CanvasRenderingContext2D,
    operations,
    getOperations,
    clearOperations,
    cleanup,
  }
}

/**
 * Mock canvas component for React
 *
 * @example
 * ```typescript
 * import { MockCanvas } from '@ux.qa/frontmock'
 *
 * const canvasRef = React.createRef<HTMLCanvasElement>()
 * render(<MockCanvas ref={canvasRef} width={800} height={600} />)
 * ```
 */
export const MockCanvas = React.forwardRef<
  HTMLCanvasElement,
  React.CanvasHTMLAttributes<HTMLCanvasElement>
>(({ width = 800, height = 600, ...props }, ref) => {
  const { canvas } = setupMockCanvas(Number(width), Number(height))

  React.useImperativeHandle(ref, () => canvas)

  return (
    <div
      {...props}
      data-testid="mock-canvas"
      style={{
        width,
        height,
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        display: 'inline-block',
        ...props.style,
      }}
    />
  )
})

MockCanvas.displayName = 'MockCanvas'
