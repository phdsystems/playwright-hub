/**
 * Custom Assertions
 *
 * Additional assertion helpers
 */

/**
 * Assert that a value is defined (not null or undefined)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || `Expected value to be defined, got ${value}`)
  }
}

/**
 * Assert that a function throws an error
 */
export async function assertThrows(
  fn: () => any | Promise<any>,
  errorMessage?: string | RegExp
): Promise<void> {
  let threw = false
  let error: Error | undefined

  try {
    await fn()
  } catch (e) {
    threw = true
    error = e as Error
  }

  if (!threw) {
    throw new Error('Expected function to throw an error, but it did not')
  }

  if (errorMessage) {
    const message = error?.message || ''
    const matches =
      typeof errorMessage === 'string'
        ? message.includes(errorMessage)
        : errorMessage.test(message)

    if (!matches) {
      throw new Error(
        `Expected error message to match "${errorMessage}", got "${message}"`
      )
    }
  }
}

/**
 * Assert that arrays are equal (deep comparison)
 */
export function assertArrayEquals<T>(
  actual: T[],
  expected: T[],
  message?: string
): void {
  if (actual.length !== expected.length) {
    throw new Error(
      message ||
        `Array lengths differ: expected ${expected.length}, got ${actual.length}`
    )
  }

  for (let i = 0; i < actual.length; i++) {
    if (JSON.stringify(actual[i]) !== JSON.stringify(expected[i])) {
      throw new Error(
        message ||
          `Arrays differ at index ${i}: expected ${JSON.stringify(expected[i])}, got ${JSON.stringify(actual[i])}`
      )
    }
  }
}

/**
 * Assert that an object contains a subset of properties
 */
export function assertObjectContains<T extends Record<string, any>>(
  actual: T,
  expected: Partial<T>,
  message?: string
): void {
  for (const key in expected) {
    if (JSON.stringify(actual[key]) !== JSON.stringify(expected[key])) {
      throw new Error(
        message ||
          `Object differs at key "${key}": expected ${JSON.stringify(expected[key])}, got ${JSON.stringify(actual[key])}`
      )
    }
  }
}
