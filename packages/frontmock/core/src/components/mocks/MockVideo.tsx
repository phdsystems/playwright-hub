/**
 * MockVideo - Mock video component for testing
 *
 * Prevents actual video loading and playback in tests
 */

import React, { useState } from 'react'

export interface MockVideoProps {
  src: string
  poster?: string
  width?: number | string
  height?: number | string
  controls?: boolean
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  onLoadedMetadata?: () => void
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onTimeUpdate?: (currentTime: number) => void
  onError?: (error: Error) => void
  [key: string]: any
}

/**
 * Mock video component that simulates playback without actual video loading
 *
 * @example
 * ```typescript
 * import { MockVideo } from '@ux.qa/frontmock'
 *
 * const handlePlay = vi.fn()
 * const handlePause = vi.fn()
 *
 * render(
 *   <MockVideo
 *     src="/video.mp4"
 *     poster="/poster.jpg"
 *     controls
 *     onPlay={handlePlay}
 *     onPause={handlePause}
 *   />
 * )
 *
 * // Simulate play
 * await user.click(screen.getByLabelText('Play'))
 * expect(handlePlay).toHaveBeenCalled()
 * ```
 */
export function MockVideo({
  src,
  poster,
  width,
  height,
  controls = false,
  autoPlay = false,
  loop = false,
  muted = false,
  onLoadedMetadata,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onError,
  ...props
}: MockVideoProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentTime, setCurrentTime] = useState(0)
  const duration = 100 // Mock duration in seconds

  React.useEffect(() => {
    // Simulate video metadata loaded
    const timer = setTimeout(() => {
      onLoadedMetadata?.()
    }, 0)

    return () => clearTimeout(timer)
  }, [onLoadedMetadata])

  React.useEffect(() => {
    if (autoPlay) {
      onPlay?.()
    }
  }, [autoPlay, onPlay])

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const nextTime = prev + 0.1

          if (nextTime >= duration) {
            setIsPlaying(false)
            onEnded?.()
            return loop ? 0 : duration
          }

          onTimeUpdate?.(nextTime)
          return nextTime
        })
      }, 100)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, loop, duration, onEnded, onTimeUpdate])

  const handlePlay = () => {
    setIsPlaying(true)
    onPlay?.()
  }

  const handlePause = () => {
    setIsPlaying(false)
    onPause?.()
  }

  return (
    <div
      {...props}
      data-testid="mock-video"
      data-src={src}
      data-playing={isPlaying}
      data-current-time={currentTime}
      data-duration={duration}
      style={{
        width: width || 640,
        height: height || 360,
        backgroundColor: '#000',
        backgroundImage: poster ? `url(${poster})` : undefined,
        backgroundSize: 'cover',
        display: 'inline-block',
        position: 'relative',
        ...props.style,
      }}
    >
      {controls && (
        <div
          data-testid="video-controls"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          {isPlaying ? (
            <button
              aria-label="Pause"
              onClick={handlePause}
              data-testid="pause-button"
            >
              ⏸
            </button>
          ) : (
            <button
              aria-label="Play"
              onClick={handlePlay}
              data-testid="play-button"
            >
              ▶
            </button>
          )}
          <div
            data-testid="time-display"
            style={{ color: 'white', fontSize: '12px' }}
          >
            {currentTime.toFixed(1)}s / {duration}s
          </div>
        </div>
      )}
    </div>
  )
}
