# Testing Frameworks Comparison

## Cypress vs Playwright vs Vitest vs Bun Test

| Feature | Cypress | Playwright | Vitest | Bun Test |
|---------|---------|------------|--------|----------|
| **Primary use** | E2E | E2E | Unit/Component | Unit/Component |
| **Environment** | Real browser | Real browser | jsdom | happy-dom/jsdom |
| **Speed** | Slow | Medium | Fast | Fastest |
| **Browsers** | Chrome, Firefox, Edge | + Safari/WebKit | None | None |
| **License** | MIT | Apache 2.0 | MIT | MIT |
| **Parallel (free)** | No (paid) | Yes | Yes | Yes |
| **Runtime** | Node | Node | Node | Bun |
| **Written in** | JavaScript | TypeScript | TypeScript | Zig + TypeScript |
| **Multi-tab/window** | Limited | Yes | N/A | N/A |
| **iframes** | Difficult | Yes Easy | Limited | Limited |
| **Shadow DOM** | Limited | Yes Full | Yes | Yes |
| **Network mocking** | Yes | Yes | Yes (msw) | Yes (built-in) |
| **API testing** | Yes | Yes | Yes | Yes |
| **Component testing** | Yes | Yes (CT) | Yes | Yes |
| **Full app E2E** | Yes | Yes | No | No |
| **Visual testing** | Plugin | Yes Built-in | Snapshot only | Snapshot |
| **Auto-wait** | Yes | Yes | Yes (findBy*) | No |
| **Test generator** | Cypress Studio | Codegen | No | No |
| **Trace viewer** | Paid Cloud | Yes Free | No | No |
| **Video recording** | Yes | Yes | No | No |
| **Screenshots** | Yes | Yes | No | No |
| **TypeScript** | Yes | Yes | Yes | Yes Native |
| **Languages** | JS/TS only | JS, TS, Python, Java, C# | JS/TS | JS/TS |
| **Jest compatible** | No | No | Yes | Yes |
| **Watch mode** | Yes | Yes | Yes Excellent | Yes |
| **Coverage** | Yes | Yes | Yes (c8/istanbul) | Yes Built-in |
| **Matchers** | Chai | Built-in | Chai/Jest | Jest |
| **Setup complexity** | Medium | Medium | Low | Lowest |
| **CI cost** | Higher | Medium | Low | Low |
| **CSS rendering** | Yes Real | Yes Real | No Simulated | No Simulated |
| **Browser APIs** | Yes Full | Yes Full | Partial | Partial |
| **Ecosystem** | Large | Growing | Large | Smaller |
| **DOM library** | Built-in | Built-in | testing-library | testing-library |

## When to use each

| Tool | Best for |
|------|----------|
| **Bun Test** | Fastest unit tests, Bun-native projects |
| **Vitest** | Vite projects, larger ecosystem, more mature |
| **Playwright** | E2E, cross-browser, visual testing |
| **Cypress** | E2E with interactive debugging DX |

## Common strategy

Many projects use **both**:
- **Vitest + testing-library**: Fast component tests (run often, in watch mode)
- **Playwright**: E2E tests for critical user flows (run in CI)
