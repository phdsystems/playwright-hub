/**
 * MockAudio - Mock audio component for testing
 *
 * Prevents actual audio loading and playback in tests
 */

import React, { useState } from 'react'

export interface MockAudioProps {
  src: string
  controls?: boolean
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  volume?: number
  onLoadedMetadata?: () => void
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onTimeUpdate?: (currentTime: number) => void
  onVolumeChange?: (volume: number) => void
  onError?: (error: Error) => void
  [key: string]: any
}

/**
 * Mock audio component that simulates playback without actual audio loading
 *
 * @example
 * ```typescript
 * import { MockAudio } from '@ux.qa/frontmock'
 *
 * const handlePlay = vi.fn()
 * const handlePause = vi.fn()
 *
 * render(
 *   <MockAudio
 *     src="/audio.mp3"
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
export function MockAudio({
  src,
  controls = false,
  autoPlay = false,
  loop = false,
  muted = false,
  volume = 1.0,
  onLoadedMetadata,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onVolumeChange,
  onError,
  ...props
}: MockAudioProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentTime, setCurrentTime] = useState(0)
  const [currentVolume, setCurrentVolume] = useState(volume)
  const duration = 180 // Mock duration in seconds (3 minutes)

  React.useEffect(() => {
    // Simulate audio metadata loaded
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

  const handleVolumeChange = (newVolume: number) => {
    setCurrentVolume(newVolume)
    onVolumeChange?.(newVolume)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      {...props}
      data-testid="mock-audio"
      data-src={src}
      data-playing={isPlaying}
      data-current-time={currentTime}
      data-duration={duration}
      data-volume={currentVolume}
      style={{
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '12px',
        display: 'inline-block',
        ...props.style,
      }}
    >
      {controls && (
        <div
          data-testid="audio-controls"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {isPlaying ? (
            <button
              aria-label="Pause"
              onClick={handlePause}
              data-testid="pause-button"
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              ⏸
            </button>
          ) : (
            <button
              aria-label="Play"
              onClick={handlePlay}
              data-testid="play-button"
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              ▶
            </button>
          )}

          <div style={{ flex: 1 }}>
            <div
              data-testid="time-display"
              style={{
                fontSize: '12px',
                marginBottom: '4px',
              }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#ddd',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                data-testid="progress-bar"
                style={{
                  width: `${(currentTime / duration) * 100}%`,
                  height: '100%',
                  backgroundColor: '#007bff',
                  transition: 'width 0.1s',
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '14px' }}>🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={currentVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              aria-label="Volume"
              data-testid="volume-slider"
              style={{ width: '60px' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
