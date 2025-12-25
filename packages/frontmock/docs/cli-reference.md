# CLI Reference

Complete reference for the UX.QA CLI tool.

## Installation

```bash
npm install --global @ux.qa/test-cli
```

## Commands

### `uxqa init`

Initialize the test framework in your project.

```bash
uxqa init [options]
```

**Options:**
- `--provider <provider>` - Test provider (vitest|jest|playwright)
- `--framework <framework>` - Project framework (react|vue|angular|node)
- `--skip-install` - Skip package installation

**Example:**
```bash
uxqa init --provider vitest --framework react
```

---

### `uxqa scan`

Scan codebase for components and test coverage.

```bash
uxqa scan [path] [options]
```

**Arguments:**
- `[path]` - Path to scan (default: `.`)

**Options:**
- `-f, --format <format>` - Output format (console|json|markdown)
- `-o, --output <file>` - Output file path
- `--framework <framework>` - Framework (react|vue|angular|auto)
- `--include <patterns...>` - File patterns to include
- `--exclude <patterns...>` - File patterns to exclude

**Examples:**
```bash
# Scan current directory
uxqa scan

# Scan with JSON output
uxqa scan ./src --format json --output coverage.json

# Scan React components only
uxqa scan --framework react --include '**/*.tsx'
```

---

### `uxqa generate`

Generate test files from component analysis.

```bash
uxqa generate [path] [options]
```

**Arguments:**
- `[path]` - Path to analyze (default: `.`)

**Options:**
- `-t, --template <template>` - Test template (playwright|vitest|jest)
- `-o, --output <dir>` - Output directory (default: `./tests`)
- `--framework <framework>` - Framework (react|vue|angular)
- `--dry-run` - Preview without writing files
- `--force` - Overwrite existing tests

**Examples:**
```bash
# Generate Playwright tests
uxqa generate ./src --template playwright

# Preview generation
uxqa generate ./src --dry-run

# Force overwrite existing tests
uxqa generate ./src --force
```

---

### `uxqa run`

Execute tests with the configured provider.

```bash
uxqa run [options]
```

**Options:**
- `-p, --provider <provider>` - Test provider (vitest|jest|playwright|bun)
- `-w, --watch` - Watch mode
- `--coverage` - Collect coverage
- `--ui` - Open test UI

**Examples:**
```bash
# Run tests
uxqa run

# Run with coverage
uxqa run --coverage

# Run in watch mode
uxqa run --watch

# Run with UI
uxqa run --ui
```

---

### `uxqa report`

Generate test coverage and analysis reports.

```bash
uxqa report [options]
```

**Options:**
- `-f, --format <format>` - Report format (html|json|markdown)
- `-o, --output <dir>` - Output directory (default: `./reports`)
- `--open` - Open report in browser

**Examples:**
```bash
# Generate HTML report
uxqa report --format html

# Generate and open report
uxqa report --open

# Generate JSON report
uxqa report --format json --output ./coverage/report.json
```

---

## Global Options

All commands support these global options:

- `-h, --help` - Display help
- `-V, --version` - Display version

## Configuration File

The CLI reads from `uxqa.config.ts` in your project root:

```typescript
import { defineConfig } from '@ux.qa/frontmock'

export default defineConfig({
  testRunner: 'vitest',
  framework: 'react',
  scanner: {
    include: ['**/*.{ts,tsx}'],
    exclude: ['**/*.test.{ts,tsx}', '**/node_modules/**']
  },
  generator: {
    outputDir: './tests',
    template: 'vitest'
  }
})
```

## Environment Variables

- `UXQA_HUB_URL` - UX.QA dashboard URL for reporting
- `UXQA_API_KEY` - API key for dashboard authentication

## Examples

### Complete Workflow

```bash
# 1. Initialize
uxqa init --provider vitest --framework react

# 2. Scan codebase
uxqa scan ./src --format json --output coverage.json

# 3. Generate tests
uxqa generate ./src --template vitest

# 4. Run tests
uxqa run --coverage

# 5. Generate report
uxqa report --format html --open
```

### CI/CD Integration

```bash
# In your CI pipeline
uxqa scan ./src --format json --output coverage.json
uxqa run --coverage
uxqa report --format json
```

## Troubleshooting

### Command not found

Make sure `@ux.qa/test-cli` is installed globally or use `npx`:

```bash
npx uxqa scan
```

### Provider not detected

Explicitly specify the provider:

```bash
uxqa run --provider vitest
```

## Next Steps

- Read [Getting Started](./getting-started.md)
- See [Configuration](./configuration.md)
- Browse [Examples](../examples/)
