/**
 * @file jest.setup.ts
 * @description Jest global setup and configuration
 * @created 2026-02-12
 */

import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';

// Mock console methods to reduce noise in test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Filter out expected Next.js warnings
    const message = args[0]?.toString() || '';
    if (
      message.includes('Warning: ReactDOM.render')
      || message.includes('Not implemented: HTMLFormElement.prototype.submit')
    ) {
      return;
    }
    originalError.call(console, ...args);
  });

  console.warn = jest.fn((...args) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes('Warning:')
      || message.includes('act(')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test timeout
jest.setTimeout(10000);
