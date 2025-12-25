/**
 * MockImage - Mock image component for testing
 *
 * Prevents actual image loading in tests
 */

import React from 'react'

export interface MockImageProps {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  onLoad?: () => void
  onError?: (error: Error) => void
  [key: string]: any
}

/**
 * Mock image component that simulates loading without actual HTTP requests
 *
 * @example
 * ```typescript
 * import { MockImage } from '@ux.qa/frontmock'
 *
 * const handleLoad = vi.fn()
 * render(<MockImage src="/test.jpg" alt="Test" onLoad={handleLoad} />)
 *
 * // Trigger load event
 * fireEvent.load(screen.getByRole('img'))
 * expect(handleLoad).toHaveBeenCalled()
 * ```
 */
export function MockImage({
  src,
  alt,
  width,
  height,
  onLoad,
  onError,
  ...props
}: MockImageProps) {
  React.useEffect(() => {
    // Simulate successful image load
    const timer = setTimeout(() => {
      onLoad?.()
    }, 0)

    return () => clearTimeout(timer)
  }, [onLoad])

  return (
    <div
      {...props}
      role="img"
      aria-label={alt}
      data-testid="mock-image"
      data-src={src}
      style={{
        width: width || 'auto',
        height: height || 'auto',
        backgroundColor: '#f0f0f0',
        display: 'inline-block',
        ...props.style,
      }}
    />
  )
}
