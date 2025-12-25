/**
 * Counter Component Tests
 *
 * Example using @ux.qa/frontmock with Vitest
 */

import { t } from '@ux.qa/frontmock'
import { Counter } from '../src/Counter'

const { describe, it, expect, vi, render, screen, userEvent } = t

describe('Counter', () => {
  it('renders with initial count', () => {
    render(<Counter initialCount={5} />)

    expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 5')
  })

  it('increments count when increment button is clicked', async () => {
    const user = userEvent.setup()
    render(<Counter />)

    await user.click(screen.getByTestId('increment-btn'))

    expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 1')
  })

  it('decrements count when decrement button is clicked', async () => {
    const user = userEvent.setup()
    render(<Counter initialCount={5} />)

    await user.click(screen.getByTestId('decrement-btn'))

    expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 4')
  })

  it('resets count when reset button is clicked', async () => {
    const user = userEvent.setup()
    render(<Counter initialCount={0} />)

    await user.click(screen.getByTestId('increment-btn'))
    await user.click(screen.getByTestId('increment-btn'))
    await user.click(screen.getByTestId('reset-btn'))

    expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 0')
  })

  it('calls onCountChange when count changes', async () => {
    const onCountChange = vi.fn()
    const user = userEvent.setup()

    render(<Counter onCountChange={onCountChange} />)

    await user.click(screen.getByTestId('increment-btn'))

    expect(onCountChange).toHaveBeenCalledWith(1)
  })

  it('allows multiple increments', async () => {
    const user = userEvent.setup()
    render(<Counter />)

    await user.click(screen.getByTestId('increment-btn'))
    await user.click(screen.getByTestId('increment-btn'))
    await user.click(screen.getByTestId('increment-btn'))

    expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 3')
  })
})
