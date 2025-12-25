/**
 * Output formatters for scan results
 */

import type { ScanResult } from '../types'

export type OutputFormat = 'console' | 'json' | 'markdown'

/**
 * Format scan results for output
 */
export function formatOutput(results: ScanResult, format: OutputFormat): string {
  switch (format) {
    case 'json':
      return formatJson(results)
    case 'markdown':
      return formatMarkdown(results)
    case 'console':
    default:
      return formatConsole(results)
  }
}

function formatJson(results: ScanResult): string {
  return JSON.stringify(results, null, 2)
}

function formatMarkdown(results: ScanResult): string {
  const lines: string[] = []

  lines.push('# Component Analysis Report')
  lines.push('')
  lines.push('## Components')
  lines.push('')
  lines.push('| Component | File | Tests | Props | Elements |')
  lines.push('|-----------|------|-------|-------|----------|')

  results.components.forEach(c => {
    const testsIcon = c.hasTests ? '✓' : '✗'
    lines.push(`| ${c.name} | ${c.filePath} | ${testsIcon} | ${c.props.length} | ${c.elements.length} |`)
  })

  lines.push('')
  lines.push('## Coverage')
  lines.push('')
  lines.push(`- **Components**: ${results.coverage.testedComponents}/${results.coverage.totalComponents} (${Math.round((results.coverage.testedComponents / results.coverage.totalComponents) * 100)}%)`)
  lines.push(`- **Elements with test-id**: ${results.coverage.elementsWithTestId}/${results.coverage.totalElements} (${Math.round((results.coverage.elementsWithTestId / results.coverage.totalElements) * 100)}%)`)

  if (results.warnings.length > 0) {
    lines.push('')
    lines.push('## Warnings')
    lines.push('')
    results.warnings.forEach(w => {
      lines.push(`- ${w}`)
    })
  }

  return lines.join('\n')
}

function formatConsole(results: ScanResult): string {
  const lines: string[] = []

  lines.push('Components')
  lines.push('──────────────────────────────────────')

  results.components.forEach(c => {
    const testsIcon = c.hasTests ? '✓' : '✗'
    const testIdCount = c.elements.filter(e => e.testId).length

    lines.push(`${c.name.padEnd(20)} ${c.filePath}`)
    lines.push(`  ${testsIcon} ${c.hasTests ? 'Has tests' : 'No tests'}`)
    lines.push(`  Props: ${c.props.length}`)
    lines.push(`  Elements: ${c.elements.length} (${testIdCount} with test-id)`)
    lines.push('')
  })

  lines.push('Coverage')
  lines.push('──────────────────────────────────────')
  lines.push(`Components:  ${results.coverage.testedComponents}/${results.coverage.totalComponents}  (${Math.round((results.coverage.testedComponents / results.coverage.totalComponents) * 100)}%)`)
  lines.push(`Elements:    ${results.coverage.totalElements}`)
  lines.push(`Test IDs:    ${results.coverage.elementsWithTestId}/${results.coverage.totalElements}  (${Math.round((results.coverage.elementsWithTestId / results.coverage.totalElements) * 100)}%)`)

  if (results.warnings.length > 0) {
    lines.push('')
    lines.push('Warnings')
    lines.push('──────────────────────────────────────')
    results.warnings.forEach(w => {
      lines.push(`⚠️  ${w}`)
    })
  }

  return lines.join('\n')
}
