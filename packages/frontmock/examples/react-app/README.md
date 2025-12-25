# React App Example

Example React application using `@ux.qa/frontmock` with Vitest.

## Features

- React 19 with TypeScript
- Vitest for testing
- React Testing Library integration
- Framework-agnostic test code

## Setup

```bash
npm install
```

## Run Tests

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# UI mode
npm test:ui

# Coverage
npm test:coverage
```

## Key Points

### Using the Test Framework

All tests import from `@ux.qa/frontmock`:

```typescript
import { t } from '@ux.qa/frontmock'

const { describe, it, expect, render, screen, userEvent } = t
```

This provides:
- Framework-agnostic API
- Easy migration between test runners
- Type-safe testing utilities
- Consistent patterns

### Example Test

```typescript
describe('Counter', () => {
  it('increments count', async () => {
    const user = userEvent.setup()
    render(<Counter />)

    await user.click(screen.getByTestId('increment-btn'))

    expect(screen.getByTestId('count-display')).toHaveTextContent('Count: 1')
  })
})
```

### Switching Test Providers

To switch from Vitest to Jest:

1. Install Jest: `npm install --save-dev jest @types/jest`
2. Update package.json: `"test": "jest"`
3. Tests remain unchanged!

## Project Structure

```
react-app/
├── src/
│   └── Counter.tsx        # Example component
├── tests/
│   └── Counter.test.tsx   # Component tests
├── package.json
└── README.md
```
