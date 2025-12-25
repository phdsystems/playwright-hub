/**
 * Wait Utilities
 *
 * Helpers for async testing
 */

/**
 * Wait for a specified duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Wait for next tick
 */
export function waitForNextTick(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof process !== 'undefined' && process.nextTick) {
      process.nextTick(resolve as any)
    } else {
      setTimeout(resolve, 0)
    }
  })
}

/**
 * Wait for animation frame
 */
export function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => resolve())
    } else {
      setTimeout(resolve, 16) // ~60fps
    }
  })
}

/**
 * Retry a function until it succeeds or times out
 */
export async function retry<T>(
  fn: () => T | Promise<T>,
  options: {
    retries?: number
    delay?: number
    onRetry?: (error: Error, attempt: number) => void
  } = {}
): Promise<T> {
  const { retries = 3, delay = 100, onRetry } = options
  let lastError: Error

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (onRetry) {
        onRetry(lastError, attempt)
      }
      if (attempt < retries) {
        await wait(delay)
      }
    }
  }

  throw new Error(
    `Failed after ${retries} retries. Last error: ${lastError!.message}`
  )
}

/**
 * Poll a condition until it's true or times out
 */
export async function poll(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number
    interval?: number
    onTimeout?: () => void
  } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100, onTimeout } = options
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return
    }
    await wait(interval)
  }

  if (onTimeout) {
    onTimeout()
  }

  throw new Error(`Polling timed out after ${timeout}ms`)
}
