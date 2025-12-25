/**
 * Test Fixtures
 *
 * Common test data generators and fixtures
 */

/**
 * Generate a random ID
 */
export function generateId(prefix = 'test'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate a random email
 */
export function generateEmail(name?: string): string {
  const username = name || `user${Math.floor(Math.random() * 10000)}`
  return `${username}@test.example.com`
}

/**
 * Generate a random user fixture
 */
export function generateUser(partial?: Partial<User>): User {
  const id = generateId('user')
  return {
    id,
    name: partial?.name || `Test User ${id}`,
    email: partial?.email || generateEmail(),
    createdAt: partial?.createdAt || new Date().toISOString(),
    ...partial,
  }
}

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
  [key: string]: any
}

/**
 * Generate an array of fixtures
 */
export function generateMany<T>(
  generator: (index: number) => T,
  count: number
): T[] {
  return Array.from({ length: count }, (_, i) => generator(i))
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }

  throw new Error(`Condition not met within ${timeout}ms`)
}

/**
 * Create a deferred promise for testing async code
 */
export function createDeferred<T>() {
  let resolve: (value: T) => void
  let reject: (reason?: any) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  }
}
