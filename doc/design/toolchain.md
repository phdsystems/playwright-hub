# UX-QA Toolchain

## Stack Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| Runtime | Bun 1.3.4 | Fast JS/TS runtime |
| Framework | Next.js 16 | React meta-framework |
| UI | React 19 | Component library |
| Charts | Recharts 3.5 | Data visualization |
| E2E Testing | Playwright 1.57 | Browser automation |
| Language | TypeScript 5.9 | Type safety |

## Testing Frameworks Comparison

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

## Why Playwright?

We chose **Playwright** for E2E testing because:

| Reason | Benefit |
|--------|---------|
| Free parallelization | Fast CI runs without paid tier |
| Cross-browser | Chrome, Firefox, Safari support |
| Codegen | Generate tests by clicking |
| Trace viewer | Free debugging tool |
| TypeScript-first | Native TS support |
| Active development | Microsoft backing |

## Test Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                        Test Pyramid                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                          ╱╲                                 │
│                         ╱  ╲        E2E (Playwright)        │
│                        ╱ 10%╲       Critical user flows     │
│                       ╱──────╲                              │
│                      ╱        ╲                             │
│                     ╱   30%    ╲    Integration             │
│                    ╱────────────╲   API + Component tests   │
│                   ╱              ╲                          │
│                  ╱      60%       ╲  Unit Tests             │
│                 ╱──────────────────╲ Fast, isolated         │
│                ╱                    ╲                       │
│               ╱────────────────────────╲                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Commands

```bash
# Development
bun dev              # Start dev server

# Testing
bun test             # Run Playwright tests
bun test:ui          # Open Playwright UI mode
bun test:headed      # Run with visible browser
bun test:report      # Show HTML report

# Build
bun build            # Production build
bun start            # Start production server
```

## CI/CD Integration

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: bun install

- name: Install Playwright browsers
  run: bunx playwright install --with-deps

- name: Run E2E tests
  run: bun test

- name: Upload report
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
```

## Telemetry

| Destination | Purpose |
|-------------|---------|
| Prometheus | Metrics scraping |
| InfluxDB | Time-series data |
| Dashboard | Real-time visualization |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `UXQA_STORAGE` | Storage backend (file, redis, postgres) |
| `UXQA_TELEMETRY` | Telemetry destination |
| `INFLUXDB_URL` | InfluxDB connection URL |
| `INFLUXDB_TOKEN` | InfluxDB auth token |

## File Structure

```
~/ux-qa/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── apps/              # App pages
│   ├── help/              # Help pages
│   └── tools/             # Tool pages
├── components/            # React components
│   └── dashboard/         # Dashboard components
├── lib/                   # Utilities
├── tests/                 # Playwright tests
├── packages/              # Monorepo packages
├── playwright.config.ts   # Playwright config
└── package.json
```

## Components

| Component | Location | Description |
|-----------|----------|-------------|
| `RunDashboard` | `components/dashboard/` | Main dashboard with KPIs, charts, filters, run tables |
| `ArtifactViewer` | `components/apps/` | View/preview test artifacts (screenshots, videos) |

### RunDashboard

Main dashboard component featuring:

```
┌─────────────────────────────────────────────────────────┐
│ RunDashboard                                            │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ KPI Cards (Total, Pass Rate, Duration, Coverage)   │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│ │ Timeline      │ │ Coverage Hist │ │ Duration Hist │   │
│ │ (LineChart)   │ │ (BarChart)    │ │ (BarChart)    │   │
│ └───────────────┘ └───────────────┘ └───────────────┘   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Failure Hotspots Table                              │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Filters (Status, Environment, Suite) + Saved       │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ App Sections (per app with sparkline + run table)  │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time updates via SSE (`/api/events`)
- Configurable widgets (toggle visibility)
- Theme support (dark/light/auto)
- Saved filters
- Status sparkline per app

### ArtifactViewer

Split-pane artifact browser:

```
┌─────────────────────────────────────────────────────────┐
│ ArtifactViewer                                          │
├──────────────────┬──────────────────────────────────────┤
│ Run List         │ Preview                              │
│ ┌──────────────┐ │ ┌──────────────────────────────────┐ │
│ │ 12/25 smoke  │ │ │ Suite: smoke – staging           │ │
│ │ staging      │ │ │ Commit: abc123                   │ │
│ ├──────────────┤ │ │                                  │ │
│ │ 12/24 regr   │ │ │ [Open Artifact] [Copy URL]       │ │
│ │ prod         │ │ │                                  │ │
│ ├──────────────┤ │ │ ┌──────────────────────────────┐ │ │
│ │ 12/24 smoke  │ │ │ │ Preview placeholder          │ │ │
│ │ ci           │ │ │ │ (screenshots/videos)         │ │ │
│ └──────────────┘ │ │ └──────────────────────────────┘ │ │
│                  │ └──────────────────────────────────┘ │
└──────────────────┴──────────────────────────────────────┘
```

## E2E Tests

| Test File | Coverage |
|-----------|----------|
| `tests/api.spec.ts` | API endpoint testing |
| `tests/dashboard.spec.ts` | UI + real-time updates |

### api.spec.ts

Tests for REST API endpoints:

```typescript
test.describe('API /api/runs', () => {
  test('POST /api/runs creates a new test run')
  test('GET /api/runs returns list of runs')
  test('POST /api/runs validates required fields')
  test('POST /api/runs with failed status')
});

test.describe('API /api/metrics', () => {
  test('GET /api/metrics/prometheus returns prometheus format')
});
```

| Test | Validates |
|------|-----------|
| POST create | Returns 201, generates ID, stores payload |
| GET list | Returns array of runs |
| POST validation | Returns 400 for missing fields |
| POST failed | Handles failed status correctly |
| GET metrics | Returns Prometheus text format |

### dashboard.spec.ts

Tests for UI and real-time functionality:

```typescript
test.describe('Dashboard', () => {
  test('loads homepage with title')
  test('displays empty state when no runs')
  test('can navigate to help page')
});

test.describe('Dashboard with test runs', () => {
  test('displays test run in dashboard')
  test('can navigate to app detail page')
});

test.describe('Real-time updates', () => {
  test('receives new runs via SSE')
});
```

| Test | Validates |
|------|-----------|
| Homepage load | Title, heading visible |
| Empty state | Handles no data gracefully |
| Navigation | Links to help pages work |
| Run display | Seeded data appears in UI |
| App detail | Click navigates to /apps/:id |
| SSE updates | New POSTed runs appear in real-time |

### Test Data Seeding

Tests use `beforeEach` hooks to seed data via API:

```typescript
test.beforeEach(async ({ request }) => {
  await request.post('/api/runs', {
    data: {
      appId: 'e2e-test-app',
      suite: 'regression',
      environment: 'ci',
      status: 'passed',
      total: 50,
      passed: 50,
      failed: 0,
      durationMs: 120000,
      coverage: 92,
    },
  });
});
```

### Running Tests

```bash
# All tests
bun test

# With UI mode (interactive)
bun test:ui

# Headed (see browser)
bun test:headed

# Specific file
bunx playwright test tests/api.spec.ts

# Generate new tests
bunx playwright codegen http://localhost:3000
```
