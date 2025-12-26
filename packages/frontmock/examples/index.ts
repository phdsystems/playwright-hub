/**
 * FrontMock Examples Index
 *
 * This file lists all available examples for reference.
 * Run individual examples with: bun run examples/mocks/<name>.example.ts
 * Run all examples with: bun run examples/run-examples.ts
 */

export const examples = {
  mocks: {
    // Browser API Mocks
    'storage': 'mocks/storage.example.ts',
    'intersection-observer': 'mocks/intersection-observer.example.ts',
    'resize-observer': 'mocks/resize-observer.example.ts',
    'match-media': 'mocks/match-media.example.ts',
    'clipboard': 'mocks/clipboard.example.ts',
    'websocket': 'mocks/websocket.example.ts',
    'file-reader': 'mocks/file-reader.example.ts',
    'animation-frame': 'mocks/animation-frame.example.ts',
    'geolocation': 'mocks/geolocation.example.ts',
    'network-information': 'mocks/network-information.example.ts',
    'page-visibility': 'mocks/page-visibility.example.ts',
    'media-devices': 'mocks/media-devices.example.ts',
    'mutation-observer': 'mocks/mutation-observer.example.ts',
  },
  utilities: {
    'assertions': 'utilities/assertions.example.ts',
    'wait': 'utilities/wait.example.ts',
    'fixtures': 'utilities/fixtures.example.ts',
    'mocks': 'utilities/mocks.example.ts',
  },
  wrappers: {
    'test-boundary': 'wrappers/test-boundary.example.tsx',
    'test-harness': 'wrappers/test-harness.example.tsx',
    'render-with-providers': 'wrappers/render-with-providers.example.tsx',
  },
}

export default examples
