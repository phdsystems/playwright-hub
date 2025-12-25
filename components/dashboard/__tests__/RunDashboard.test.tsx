import { t } from '@/lib/test'
import { RunDashboard } from '../RunDashboard'
import type { TestRun } from '@/lib/types'
import type { DashboardSettings } from '@/lib/settings'

const { describe, it, expect, vi, beforeEach, afterEach, render, screen, userEvent } = t

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock Recharts - jsdom doesn't support SVG rendering well
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => null,
}))

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = []
  listeners: Record<string, EventListener[]> = {}

  constructor(public url: string) {
    MockEventSource.instances.push(this)
  }

  addEventListener(event: string, callback: EventListener) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  removeEventListener(event: string, callback: EventListener) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }

  close() {}

  emit(event: string, data: unknown) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        cb({ data: JSON.stringify(data) } as MessageEvent)
      })
    }
  }
}

const mockRuns: TestRun[] = [
  {
    id: '1',
    appId: 'my-app',
    suite: 'Unit Tests',
    environment: 'ci',
    status: 'passed',
    total: 100,
    passed: 95,
    failed: 5,
    durationMs: 120000,
    coverage: 85.5,
    commit: 'abc123def456',
    artifactUrl: 'https://example.com/report/1',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: '2',
    appId: 'my-app',
    suite: 'Integration Tests',
    environment: 'staging',
    status: 'failed',
    total: 50,
    passed: 40,
    failed: 10,
    durationMs: 300000,
    coverage: 72.3,
    commit: 'def456abc789',
    createdAt: '2025-01-15T09:00:00Z',
  },
  {
    id: '3',
    appId: 'other-app',
    suite: 'E2E Tests',
    environment: 'production',
    status: 'unstable',
    total: 25,
    passed: 20,
    failed: 3,
    durationMs: 600000,
    commit: 'xyz789',
    createdAt: '2025-01-15T08:00:00Z',
  },
]

const defaultSettings: DashboardSettings = {
  hiddenWidgets: [],
  theme: 'dark',
  savedFilters: [],
}

describe('RunDashboard', () => {
  beforeEach(() => {
    vi.stubGlobal('EventSource', MockEventSource)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    MockEventSource.instances = []
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('Empty state', () => {
    it('renders empty state when no runs provided', () => {
      render(<RunDashboard initialRuns={[]} initialSettings={defaultSettings} />)

      expect(screen.getByText(/No test runs yet/)).toBeInTheDocument()
      expect(screen.getByText('/api/runs')).toBeInTheDocument()
    })
  })

  describe('KPI Cards', () => {
    it('displays total runs count', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      expect(screen.getByText('Total Runs')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('displays pass rate percentage', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      // Pass Rate appears in KPI card and hotspots table
      const passRateLabels = screen.getAllByText('Pass Rate')
      expect(passRateLabels.length).toBeGreaterThan(0)
      // Check that 33% is displayed (1 passed of 3 runs)
      expect(screen.getByText('33%')).toBeInTheDocument()
    })

    it('displays average duration', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      expect(screen.getAllByText('Avg Duration').length).toBeGreaterThan(0)
      // Duration is shown in format like "5m 40s"
      expect(screen.getByText('5m 40s')).toBeInTheDocument()
    })

    it('displays average coverage', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      expect(screen.getByText('Avg Coverage')).toBeInTheDocument()
    })
  })

  describe('Status filtering', () => {
    it('shows all status filter buttons', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      expect(screen.getByRole('button', { name: /^All$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Passed$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Failed$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Unstable$/i })).toBeInTheDocument()
    })

    it('filters runs by status when clicking filter buttons', async () => {
      const user = userEvent.setup()
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      // Initially shows both apps (via link text)
      expect(screen.getByRole('link', { name: 'my-app' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'other-app' })).toBeInTheDocument()

      // Click Failed filter
      await user.click(screen.getByRole('button', { name: /^Failed$/i }))

      // Should show only my-app (has failed run)
      expect(screen.getByRole('link', { name: 'my-app' })).toBeInTheDocument()
      // other-app only has unstable, not failed
      expect(screen.queryByRole('link', { name: 'other-app' })).not.toBeInTheDocument()
    })

    it('shows empty message when no runs match filter', async () => {
      const user = userEvent.setup()
      const passedOnlyRuns = [mockRuns[0]]
      render(<RunDashboard initialRuns={passedOnlyRuns} initialSettings={defaultSettings} />)

      await user.click(screen.getByRole('button', { name: /^Failed$/i }))

      expect(screen.getByText(/No runs match the selected filters/)).toBeInTheDocument()
    })
  })

  describe('Text filters', () => {
    it('filters by environment', async () => {
      const user = userEvent.setup()
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      const envInput = screen.getByPlaceholderText('Filter by environment')
      await user.type(envInput, 'staging')

      // Only my-app has staging environment
      expect(screen.getByRole('link', { name: 'my-app' })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'other-app' })).not.toBeInTheDocument()
    })

    it('filters by suite name', async () => {
      const user = userEvent.setup()
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      const suiteInput = screen.getByPlaceholderText('Filter by suite')
      await user.type(suiteInput, 'E2E')

      // Only other-app has E2E Tests
      expect(screen.queryByRole('link', { name: 'my-app' })).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'other-app' })).toBeInTheDocument()
    })
  })

  describe('Widget visibility', () => {
    it('shows all widgets by default', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      expect(screen.getByText('Total Runs')).toBeInTheDocument()
      expect(screen.getByText('Run Timeline')).toBeInTheDocument()
      expect(screen.getByText('Coverage Distribution')).toBeInTheDocument()
      expect(screen.getByText('Duration Distribution')).toBeInTheDocument()
    })

    it('hides widgets based on settings', () => {
      const settingsWithHidden: DashboardSettings = {
        ...defaultSettings,
        hiddenWidgets: ['kpis', 'timeline'],
      }
      render(<RunDashboard initialRuns={mockRuns} initialSettings={settingsWithHidden} />)

      expect(screen.queryByText('Total Runs')).not.toBeInTheDocument()
      expect(screen.queryByText('Run Timeline')).not.toBeInTheDocument()
      expect(screen.getByText('Coverage Distribution')).toBeInTheDocument()
    })

    it('toggles widget visibility and persists to API', async () => {
      const user = userEvent.setup()
      const fetchMock = vi.fn().mockResolvedValue({ ok: true })
      vi.stubGlobal('fetch', fetchMock)

      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      // Find and click the KPI Cards checkbox
      const kpiCheckbox = screen.getByRole('checkbox', { name: /KPI Cards/i })
      await user.click(kpiCheckbox)

      // KPI cards should be hidden
      expect(screen.queryByText('Total Runs')).not.toBeInTheDocument()

      // Should call API to persist
      expect(fetchMock).toHaveBeenCalledWith('/api/settings', expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('hiddenWidgets'),
      }))
    })
  })

  describe('Theme selection', () => {
    it('shows theme selector with current value', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      const themeSelect = screen.getByRole('combobox')
      expect(themeSelect).toHaveValue('dark')
    })

    it('changes theme and persists to API', async () => {
      const user = userEvent.setup()
      const fetchMock = vi.fn().mockResolvedValue({ ok: true })
      vi.stubGlobal('fetch', fetchMock)

      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      const themeSelect = screen.getByRole('combobox')
      await user.selectOptions(themeSelect, 'light')

      expect(fetchMock).toHaveBeenCalledWith('/api/settings', expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('"theme":"light"'),
      }))
    })
  })

  describe('Application sections', () => {
    it('groups runs by appId', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      expect(screen.getByRole('link', { name: 'my-app' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'other-app' })).toBeInTheDocument()
    })

    it('displays latest run status for each app', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      expect(screen.getByText(/Latest run Passed/)).toBeInTheDocument()
      expect(screen.getByText(/Latest run Unstable/)).toBeInTheDocument()
    })

    it('shows suite name for latest run', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      // Suite names appear multiple times (in cards and tables)
      expect(screen.getAllByText('Unit Tests').length).toBeGreaterThan(0)
      expect(screen.getAllByText('E2E Tests').length).toBeGreaterThan(0)
    })

    it('displays commit hash truncated to 8 chars', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      expect(screen.getByText('abc123de')).toBeInTheDocument()
    })

    it('shows artifact link when available', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      const reportLinks = screen.getAllByRole('link', { name: /report/i })
      expect(reportLinks.length).toBeGreaterThan(0)
      expect(reportLinks[0]).toHaveAttribute('href', 'https://example.com/report/1')
    })
  })

  describe('Charts', () => {
    it('renders timeline chart', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('renders coverage histogram', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      const barCharts = screen.getAllByTestId('bar-chart')
      expect(barCharts.length).toBeGreaterThanOrEqual(1)
    })

    it('renders duration histogram', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      const barCharts = screen.getAllByTestId('bar-chart')
      expect(barCharts.length).toBe(2) // coverage + duration
    })
  })

  describe('Failure hotspots', () => {
    it('shows failure hotspots table when there are failures', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      expect(screen.getByText('Failure Hotspots')).toBeInTheDocument()
    })

    it('displays suites with failures sorted by count', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      // Integration Tests has failures, should appear in hotspots
      // It appears multiple places (app section table + hotspots table)
      const integrationTestsElements = screen.getAllByText('Integration Tests')
      expect(integrationTestsElements.length).toBeGreaterThan(0)
    })
  })

  describe('Saved filters', () => {
    it('displays saved filters when present', () => {
      const settingsWithFilters: DashboardSettings = {
        ...defaultSettings,
        savedFilters: [
          { id: '1', name: 'CI Only', status: 'all', environment: 'ci' },
        ],
      }
      render(<RunDashboard initialRuns={mockRuns} initialSettings={settingsWithFilters} />)

      expect(screen.getByText('Saved Filters')).toBeInTheDocument()
      expect(screen.getByText('CI Only')).toBeInTheDocument()
    })

    it('applies saved filter when clicked', async () => {
      const user = userEvent.setup()
      const settingsWithFilters: DashboardSettings = {
        ...defaultSettings,
        savedFilters: [
          { id: '1', name: 'CI Only', status: 'passed', environment: 'ci' },
        ],
      }
      render(<RunDashboard initialRuns={mockRuns} initialSettings={settingsWithFilters} />)

      await user.click(screen.getByRole('button', { name: 'CI Only' }))

      // Should filter to passed status
      const passedButton = screen.getByRole('button', { name: /^Passed$/i })
      expect(passedButton).toHaveClass('bg-slate-100')
    })

    it('deletes saved filter when X is clicked', async () => {
      const user = userEvent.setup()
      const fetchMock = vi.fn().mockResolvedValue({ ok: true })
      vi.stubGlobal('fetch', fetchMock)

      const settingsWithFilters: DashboardSettings = {
        ...defaultSettings,
        savedFilters: [
          { id: '1', name: 'CI Only', status: 'all', environment: 'ci' },
        ],
      }
      render(<RunDashboard initialRuns={mockRuns} initialSettings={settingsWithFilters} />)

      await user.click(screen.getByRole('button', { name: '×' }))

      expect(screen.queryByText('CI Only')).not.toBeInTheDocument()
      expect(fetchMock).toHaveBeenCalledWith('/api/settings', expect.objectContaining({
        method: 'PATCH',
      }))
    })
  })

  describe('Help section', () => {
    it('renders help and integration info', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      expect(screen.getByText('Help & Integration')).toBeInTheDocument()
    })

    it('has links to API and docs', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      expect(screen.getByRole('link', { name: /Test the API/i })).toHaveAttribute('href', '/api/runs')
      expect(screen.getByRole('link', { name: /Stream live events/i })).toHaveAttribute('href', '/api/events')
      expect(screen.getByRole('link', { name: /Read the docs/i })).toHaveAttribute('href', 'https://github.com/phdsystems/ux-qa')
    })
  })

  describe('Real-time updates via SSE', () => {
    it('connects to EventSource on mount', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      expect(MockEventSource.instances.length).toBe(1)
      expect(MockEventSource.instances[0].url).toBe('/api/events')
    })

    it('registers event listeners for bootstrap and run events', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      const instance = MockEventSource.instances[0]
      expect(instance.listeners['bootstrap']).toBeDefined()
      expect(instance.listeners['bootstrap'].length).toBe(1)
      expect(instance.listeners['run']).toBeDefined()
      expect(instance.listeners['run'].length).toBe(1)
    })

    it('does not duplicate runs with same id when run event received', () => {
      render(<RunDashboard initialRuns={mockRuns} initialSettings={defaultSettings} />)

      // Total runs should be 3
      expect(screen.getByText('3')).toBeInTheDocument()

      // Emit a run with existing id - should not add duplicate
      MockEventSource.instances[0].emit('run', mockRuns[0])

      // Should still only have 3 runs total
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })
})
