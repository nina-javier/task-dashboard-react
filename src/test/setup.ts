import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  // FilterContext/Dashboard sync filters+sort into the URL via
  // history.replaceState; reset between tests so one test's query string
  // doesn't leak into the next test's lazy-init read.
  window.history.replaceState(null, '', '/')
})
