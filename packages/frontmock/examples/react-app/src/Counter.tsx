import { useState } from 'react'

export interface CounterProps {
  initialCount?: number
  onCountChange?: (count: number) => void
}

export function Counter({ initialCount = 0, onCountChange }: CounterProps) {
  const [count, setCount] = useState(initialCount)

  const handleIncrement = () => {
    const newCount = count + 1
    setCount(newCount)
    onCountChange?.(newCount)
  }

  const handleDecrement = () => {
    const newCount = count - 1
    setCount(newCount)
    onCountChange?.(newCount)
  }

  const handleReset = () => {
    setCount(initialCount)
    onCountChange?.(initialCount)
  }

  return (
    <div data-testid="counter">
      <h1>Counter Example</h1>
      <p data-testid="count-display">Count: {count}</p>
      <div>
        <button onClick={handleDecrement} data-testid="decrement-btn">
          Decrement
        </button>
        <button onClick={handleReset} data-testid="reset-btn">
          Reset
        </button>
        <button onClick={handleIncrement} data-testid="increment-btn">
          Increment
        </button>
      </div>
    </div>
  )
}
