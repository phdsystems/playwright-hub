# Developer Guide

## TLDR

- Clone repo, `bun install`, `bun run dev` to start dashboard
- Add `@ux.qa/reporter` to your Playwright project
- Use `@ux.qa/scanner` CLI to analyze React components
- SSE provides real-time updates to dashboard

## Table of Contents

1. [Quick Start](#quick-start)
2. [Dashboard Setup](#dashboard-setup)
3. [Reporter Integration](#reporter-integration)
4. [Scanner Usage](#scanner-usage)
5. [CI/CD Integration](#cicd-integration)
6. [Monitoring Setup](#monitoring-setup)
7. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Node.js 18+ or Bun 1.0+
- Playwright 1.40+ (for reporter)

### Full Setup

```bash
# 1. Start Dashboard
git clone https://github.com/phdsystems/ux-qa.git
cd ux-qa
bun install
bun run dev
# Dashboard available at http://localhost:3200

# 2. In your Playwright project
npm install @ux.qa/reporter

# 3. Configure playwright.config.ts
# (see Reporter Integration below)

# 4. Run tests
npx playwright test
# Results appear in dashboard
```

### Local Development (npm link)

For developing or testing packages locally before npm publish:

```bash
# 1. Clone and build packages
git clone https://github.com/phdsystems/ux-qa.git
cd ux.qa
bun install

# 2. Build packages
cd packages/reporter && bun run build
cd ../scanner && bun run build

# 3. Link packages globally
cd packages/reporter && npm link
cd ../scanner && npm link

# 4. In your Playwright project, link the packages
cd /path/to/your/project
npm link @ux.qa/reporter
npm link @ux.qa/scanner
```

Now changes to the source packages are immediately available without reinstalling.

**Alternative: File path dependency**

In your project's `package.json`:
```json
{
  "dependencies": {
    "@ux.qa/reporter": "file:/path/to/ux-qa/packages/reporter"
  }
}
```

## Dashboard Setup

### Local Development

```bash
# Clone and install
git clone https://github.com/phdsystems/ux-qa.git
cd ux.qa
bun install

# Start development server
bun run dev
```

Dashboard runs at `http://localhost:3200`.

### Production Deployment

**Docker:**

```bash
docker build -t uxqa .
docker run -p 3200:3200 \
  -e UXQA_STORAGE=file \
  -e UXQA_API_KEY=your-key \
  -v uxqa-data:/data \
  uxqa
```

**Docker Compose:**

```yaml
version: '3.8'
services:
  uxqa:
    build: .
    ports:
      - "3200:3200"
    environment:
      - UXQA_STORAGE=file
      - UXQA_API_KEY=${UXQA_API_KEY}
    volumes:
      - uxqa-data:/data

volumes:
  uxqa-data:
```

**Vercel/Netlify:**

```bash
# Build command
bun run build

# Output directory
.next
```

### Storage Options

**Memory (default):**
- Fast, no persistence
- Good for development

```bash
UXQA_STORAGE=memory bun run dev
```

**File:**
- JSON file persistence
- Survives restarts

```bash
UXQA_STORAGE=file UXQA_STORAGE_PATH=./data/runs.json bun run dev
```

## Reporter Integration

### Basic Setup

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['html'],  // Keep HTML reporter
    ['@ux.qa/reporter', {
      hubUrl: 'http://localhost:3200',
      appId: 'my-app',
      suite: 'e2e'
    }]
  ]
});
```

### With Authentication

```typescript
export default defineConfig({
  reporter: [
    ['@ux.qa/reporter', {
      hubUrl: process.env.UXQA_URL || 'http://localhost:3200',
      appId: 'my-app',
      suite: 'e2e',
      apiKey: process.env.UXQA_API_KEY
    }]
  ]
});
```

### Multiple Projects

```typescript
export default defineConfig({
  projects: [
    {
      name: 'chromium',
      testDir: './tests',
      use: { browserName: 'chromium' }
    },
    {
      name: 'firefox',
      testDir: './tests',
      use: { browserName: 'firefox' }
    }
  ],
  reporter: [
    ['@ux.qa/reporter', {
      hubUrl: 'http://localhost:3200',
      appId: 'my-app',
      suite: `e2e-${process.env.BROWSER || 'chromium'}`
    }]
  ]
});
```

### Conditional Reporting

Only report in CI:

```typescript
const isCI = process.env.CI === 'true';

export default defineConfig({
  reporter: [
    ['html'],
    ...(isCI ? [
      ['@ux.qa/reporter', {
        hubUrl: 'https://uxqa.company.com',
        appId: 'my-app',
        suite: 'e2e',
        apiKey: process.env.UXQA_API_KEY
      }]
    ] : [])
  ]
});
```

### Manual Submission

Without Playwright reporter:

```bash
curl -X POST http://localhost:3200/api/runs \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "my-app",
    "suite": "custom",
    "status": "passed",
    "passed": 10,
    "failed": 0,
    "skipped": 0,
    "flaky": 0,
    "total": 10,
    "duration": 30000
  }'
```

## Scanner Usage

### Installation

```bash
# Global
npm install -g @ux.qa/scanner

# Local
npm install --save-dev @ux.qa/scanner
```

### Basic Scan

```bash
# Scan current directory
uxqa-scan ./src

# Output as JSON
uxqa-scan ./src -o json

# Include props and hooks analysis
uxqa-scan ./src --props --hooks
```

### Example Output

**Table (default):**

```
┌────────────────────┬─────────────────────────┬──────┬──────────┐
│ Component          │ File                    │ Line │ Type     │
├────────────────────┼─────────────────────────┼──────┼──────────┤
│ Button             │ src/components/Button   │ 5    │ function │
│ Card               │ src/components/Card     │ 12   │ arrow    │
│ Header             │ src/layout/Header       │ 3    │ function │
└────────────────────┴─────────────────────────┴──────┴──────────┘

Found 3 components in 3 files
```

**JSON:**

```json
{
  "components": [
    {
      "name": "Button",
      "file": "src/components/Button.tsx",
      "line": 5,
      "type": "function",
      "props": ["variant", "size", "onClick"],
      "hooks": ["useState", "useCallback"]
    }
  ],
  "summary": {
    "total": 3,
    "byType": { "function": 2, "arrow": 1 }
  }
}
```

### Integration with Dashboard

Publish scan results:

```bash
uxqa-scan ./src -o json | curl -X POST http://localhost:3200/api/components \
  -H "Content-Type: application/json" \
  -d @-
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run tests
        run: npx playwright test
        env:
          UXQA_URL: ${{ secrets.UXQA_URL }}
          UXQA_API_KEY: ${{ secrets.UXQA_API_KEY }}
```

### GitLab CI

```yaml
# .gitlab-ci.yml
e2e:
  image: mcr.microsoft.com/playwright:v1.40.0
  script:
    - npm ci
    - npx playwright test
  variables:
    UXQA_URL: ${UXQA_URL}
    UXQA_API_KEY: ${UXQA_API_KEY}
```

### Jenkins

```groovy
// Jenkinsfile
pipeline {
    agent any
    environment {
        UXQA_URL = credentials('uxqa-url')
        UXQA_API_KEY = credentials('uxqa-api-key')
    }
    stages {
        stage('Test') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install --with-deps'
                sh 'npx playwright test'
            }
        }
    }
}
```

### CircleCI

```yaml
# .circleci/config.yml
version: 2.1
jobs:
  test:
    docker:
      - image: mcr.microsoft.com/playwright:v1.40.0
    steps:
      - checkout
      - run: npm ci
      - run: npx playwright test
    environment:
      UXQA_URL: ${UXQA_URL}
      UXQA_API_KEY: ${UXQA_API_KEY}

workflows:
  main:
    jobs:
      - test
```

## Monitoring Setup

### Prometheus

1. Enable Prometheus telemetry:

```bash
UXQA_TELEMETRY=prometheus bun run dev
```

2. Configure Prometheus scrape:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'uxqa'
    static_configs:
      - targets: ['localhost:3200']
    metrics_path: '/api/metrics/prometheus'
    scrape_interval: 30s
```

3. Available metrics:

```
uxqa_test_runs_total{app,suite,status}
uxqa_test_duration_seconds{app}
uxqa_tests_passed{app,suite}
uxqa_tests_failed{app,suite}
uxqa_tests_flaky{app,suite}
```

### Grafana Dashboard

Import dashboard JSON:

```json
{
  "dashboard": {
    "title": "UX.QA Test Results",
    "panels": [
      {
        "title": "Pass Rate",
        "type": "stat",
        "targets": [{
          "expr": "sum(uxqa_tests_passed) / sum(uxqa_tests_passed + uxqa_tests_failed) * 100"
        }]
      },
      {
        "title": "Test Runs",
        "type": "graph",
        "targets": [{
          "expr": "rate(uxqa_test_runs_total[5m])"
        }]
      }
    ]
  }
}
```

### InfluxDB

```bash
UXQA_TELEMETRY=influx \
UXQA_INFLUX_URL=http://localhost:8086 \
UXQA_INFLUX_TOKEN=your-token \
UXQA_INFLUX_ORG=your-org \
UXQA_INFLUX_BUCKET=uxqa \
bun run dev
```

### Slack Alerts

```bash
UXQA_SLACK_WEBHOOK=https://hooks.slack.com/services/xxx \
UXQA_ALERT_ON_FAILURE=true \
bun run dev
```

Alert message format:

```
🔴 Test Run Failed
App: my-app
Suite: e2e
Status: failed (5 passed, 2 failed, 1 flaky)
Branch: feature/new-feature
Commit: abc123
```

## Troubleshooting

### Reporter Not Sending Data

**Check network:**

```bash
# Test connection
curl http://localhost:3200/api/runs
```

**Check reporter config:**

```typescript
// Verify hubUrl is correct
console.log('UXQA URL:', options.hubUrl);
```

**Enable verbose logging:**

```bash
DEBUG=uxqa:* npx playwright test
```

### Dashboard Not Updating

**Check SSE connection:**

```javascript
// Browser console
const es = new EventSource('/api/events');
es.onmessage = (e) => console.log(e);
es.onerror = (e) => console.error(e);
```

**Check event bus:**

```bash
# Server logs
DEBUG=uxqa:bus bun run dev
```

### Scanner Missing Components

**Check file patterns:**

```bash
# List matched files
uxqa-scan ./src --dry-run
```

**Check Babel parsing:**

```bash
# Verbose output
DEBUG=uxqa:parser uxqa-scan ./src
```

### Common Issues

| Issue | Solution |
|-------|----------|
| CORS error | Ensure dashboard and reporter use same origin or configure CORS |
| 401 Unauthorized | Check API key matches on both sides |
| Connection refused | Verify dashboard is running and port is correct |
| No components found | Check include/exclude patterns match your file structure |
| Flaky count wrong | Ensure Playwright retries are configured |

### Debug Mode

```bash
# Dashboard
DEBUG=uxqa:* bun run dev

# Reporter
DEBUG=uxqa:* npx playwright test

# Scanner
DEBUG=uxqa:* uxqa-scan ./src
```

### Getting Help

- [GitHub Issues](https://github.com/phdsystems/ux-qa/issues)
- [Architecture Docs](../3-design/architecture.md)
- [API Reference](../3-design/api-reference.md)
