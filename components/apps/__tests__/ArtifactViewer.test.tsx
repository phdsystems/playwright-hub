import { t } from '@/lib/test'
import { ArtifactViewer } from '../ArtifactViewer'
import type { TestRun } from '@/lib/types'

const { describe, it, expect, vi, render, screen, userEvent } = t

const mockRuns: TestRun[] = [
  {
    id: '1',
    appId: 'app-1',
    suite: 'Unit Tests',
    environment: 'ci',
    status: 'passed',
    total: 10,
    passed: 10,
    failed: 0,
    durationMs: 5000,
    coverage: 85,
    commit: 'abc123',
    artifactUrl: 'https://example.com/artifacts/1',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: '2',
    appId: 'app-1',
    suite: 'E2E Tests',
    environment: 'staging',
    status: 'failed',
    total: 5,
    passed: 3,
    failed: 2,
    durationMs: 12000,
    commit: 'def456',
    artifactUrl: 'https://example.com/artifacts/2',
    createdAt: '2025-01-15T11:00:00Z',
  },
]

describe('ArtifactViewer', () => {
  it('renders empty state when no artifacts available', () => {
    render(<ArtifactViewer runs={[]} />)

    expect(screen.getByText('No artifacts available for this app.')).toBeInTheDocument()
  })

  it('renders empty state when runs have no artifactUrl', () => {
    const runsWithoutArtifacts: TestRun[] = [
      { ...mockRuns[0], artifactUrl: undefined },
    ]
    render(<ArtifactViewer runs={runsWithoutArtifacts} />)

    expect(screen.getByText('No artifacts available for this app.')).toBeInTheDocument()
  })

  it('renders artifact list when runs have artifacts', () => {
    render(<ArtifactViewer runs={mockRuns} />)

    expect(screen.getByText('Unit Tests')).toBeInTheDocument()
    expect(screen.getByText('E2E Tests')).toBeInTheDocument()
  })

  it('displays the first artifact as selected by default', () => {
    render(<ArtifactViewer runs={mockRuns} />)

    expect(screen.getByRole('heading', { name: /Unit Tests – ci/i })).toBeInTheDocument()
    expect(screen.getByText('Commit abc123')).toBeInTheDocument()
  })

  it('allows switching between artifacts', async () => {
    const user = userEvent.setup()
    render(<ArtifactViewer runs={mockRuns} />)

    await user.click(screen.getByRole('button', { name: /E2E Tests/i }))

    expect(screen.getByRole('heading', { name: /E2E Tests – staging/i })).toBeInTheDocument()
    expect(screen.getByText('Commit def456')).toBeInTheDocument()
  })

  it('renders Open Artifact link with correct href', () => {
    render(<ArtifactViewer runs={mockRuns} />)

    const link = screen.getByRole('link', { name: /Open Artifact/i })
    expect(link).toHaveAttribute('href', 'https://example.com/artifacts/1')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('copies artifact URL to clipboard when Copy URL is clicked', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      clipboard: { writeText },
    })

    render(<ArtifactViewer runs={mockRuns} />)

    await user.click(screen.getByRole('button', { name: /Copy URL/i }))

    expect(writeText).toHaveBeenCalledWith('https://example.com/artifacts/1')

    vi.unstubAllGlobals()
  })
})
