# Dashboard Layout

## ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  PLAYWRIGHT HUB                                            ┌───────┐ ┌────────┐ │
│  E2E Automation Dashboard                                  │ Tools │ │  Help  │ │
│  Push test runs via the API...                             └───────┘ └────────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ HELP & INTEGRATION                                                          │ │
│ │ POST results to /api/runs, subscribe to /api/events...                      │ │
│ │ ┌──────────────┐ ┌───────────────────┐ ┌───────────────┐   Theme: [Dark ▼]  │ │
│ │ │ Test the API │ │ Stream live events│ │ Read the docs │                    │ │
│ │ └──────────────┘ └───────────────────┘ └───────────────┘                    │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│  [✓] KPI Cards  [✓] Timeline  [✓] Coverage Histogram  [✓] Duration Histogram   │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐     │
│ │ Total Runs     │ │ Pass Rate      │ │ Avg Duration   │ │ Avg Coverage   │     │
│ │     42         │ │    87%         │ │   3m 24s       │ │   78.5%        │     │
│ └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘     │
│                                                                                 │
│ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐         │
│ │ Run Timeline        │ │ Coverage Distrib.   │ │ Duration Distrib.   │         │
│ │                     │ │                     │ │                     │         │
│ │   ╭──╮    ╭──╮      │ │   █                 │ │       █             │         │
│ │  ╭╯  ╰╮  ╭╯  ╰──    │ │   █  █              │ │    █  █             │         │
│ │ ─╯    ╰──╯          │ │   █  █  █  █        │ │ █  █  █  █          │         │
│ │ ──────────────────  │ │ 0-49 50-69 70-84... │ │ <1m 1-3m 3-5m ...   │         │
│ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘         │
├─────────────────────────────────────────────────────────────────────────────────┤
│ FAILURE HOTSPOTS                                                                │
│ ┌───────────┬──────────┬──────────┬───────┬───────────┬────────────┬──────────┐ │
│ │Application│ Suite    │ Failures │ Flaky │ Pass Rate │ Avg Dur    │ Last Run │ │
│ ├───────────┼──────────┼──────────┼───────┼───────────┼────────────┼──────────┤ │
│ │ app-web   │ checkout │    5     │   2   │   65%     │  2m 15s    │ 12/25... │ │
│ │ app-api   │ auth     │    3     │   1   │   72%     │  1m 45s    │ 12/25... │ │
│ └───────────┴──────────┴──────────┴───────┴───────────┴────────────┴──────────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────┐ ┌────────┐ ┌────────┐ ┌──────────┐  ┌──────────────────┐ ┌────────────┐ │
│ │ All │ │ Passed │ │ Failed │ │ Unstable │  │ Filter by env... │ │ Filter...  │ │
│ └─────┘ └────────┘ └────────┘ └──────────┘  └──────────────────┘ └────────────┘ │
│                                                              ┌─────────────┐    │
│  SAVED FILTERS: [staging-fails ×] [prod-all ×]               │ Save Filter │    │
│                                                              └─────────────┘    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ APPLICATION                                                   ┌───────────────┐ │
│ app-web                                                       │ Latest Passed │ │
│                                                               └───────────────┘ │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────────────────────┐   │
│ │ Suite      │ │ Duration   │ │ Coverage   │ │ Recent trend                 │   │
│ │ checkout   │ │ 3m 24s     │ │ 82.5%      │ │ ▃▅▇▅▃▇▅▃▇▅▃▇ (sparkline)     │   │
│ └────────────┘ └────────────┘ └────────────┘ └──────────────────────────────┘   │
│ ┌─────────┬─────────┬─────┬────────┬──────────┬──────────┬────────┬──────────┐  │
│ │ Started │ Suite   │ Env │ Totals │ Duration │ Coverage │ Commit │ Artifact │  │
│ ├─────────┼─────────┼─────┼────────┼──────────┼──────────┼────────┼──────────┤  │
│ │ 12/25.. │checkout │ prod│ 45/50  │ 3m 24s   │ 82.5%    │ a1b2c3 │ report   │  │
│ │ 12/25.. │checkout │ stg │ 48/50  │ 3m 12s   │ 81.2%    │ d4e5f6 │ report   │  │
│ └─────────┴─────────┴─────┴────────┴──────────┴──────────┴────────┴──────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Section Summary

| Section | Description |
|---------|-------------|
| Header | Title + Tools/Help nav |
| Help Box | API integration info + theme selector |
| KPI Cards | Total Runs, Pass Rate, Duration, Coverage |
| Charts | Timeline (line), Coverage & Duration (bar) |
| Hotspots | Table of failing/flaky suites |
| Filters | Status buttons + search + saved filters |
| App Sections | Per-app run history with sparkline trends |

## Component Hierarchy

```
RootLayout
└── Page
    ├── Header
    │   ├── Title ("Playwright Hub")
    │   └── Nav (Tools, Help)
    └── RunDashboard
        ├── Help & Integration Box
        │   ├── Quick Links
        │   └── Theme Selector
        ├── Widget Toggles
        ├── KPI Cards (4x)
        │   ├── Total Runs
        │   ├── Pass Rate
        │   ├── Avg Duration
        │   └── Avg Coverage
        ├── Charts (3x)
        │   ├── Run Timeline (LineChart)
        │   ├── Coverage Distribution (BarChart)
        │   └── Duration Distribution (BarChart)
        ├── Failure Hotspots Table
        ├── Filter Bar
        │   ├── Status Filters (All/Passed/Failed/Unstable)
        │   ├── Environment Search
        │   ├── Suite Search
        │   └── Save Filter Button
        ├── Saved Filters
        └── Application Sections (per app)
            ├── App Header + Status Badge
            ├── Summary Cards (Suite, Duration, Coverage, Sparkline)
            └── Runs Table
```

## Data Flow

```
┌─────────────┐     POST      ┌─────────────┐
│   CI/CD     │ ────────────► │  /api/runs  │
│  Pipeline   │               └──────┬──────┘
└─────────────┘                      │
                                     ▼
                              ┌─────────────┐
                              │  Data Store │
                              └──────┬──────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
   ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
   │  Dashboard  │◄──SSE─────│ /api/events │           │  Prometheus │
   │    (UI)     │           └─────────────┘           │  /InfluxDB  │
   └─────────────┘                                     └─────────────┘
```
