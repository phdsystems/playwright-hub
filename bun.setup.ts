/**
 * Bun Test Setup
 *
 * This file is preloaded before running bun tests.
 * It sets up the DOM environment using happy-dom.
 */

import { GlobalRegistrator } from '@happy-dom/global-registrator'

// Register happy-dom globals (window, document, etc.)
GlobalRegistrator.register()

// Add jest-dom matchers
import '@testing-library/jest-dom'
