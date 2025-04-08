import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './tests/setup/setup.js',
    testMatch: ['**/*.test.js'],
    isolate: true,
    coverage: {
      provider: 'istanbul',
      reporter: ['html', 'text', 'lcov'],
      outputFile: {
        html: 'coverage/html',
        text: 'coverage/text',
      },
      include: ['src/**/*.{js,ts}'],
    },
  },
  resolve: {
    alias: {
      '@tests': resolve(import.meta.dirname, './tests'),
    },
  },
  build: {
    dynamicImportVarsOptions: {
      /**
       * This file already uses Vite's import.meta.glob as expected, but Vite report an error
       * because it detects the dynamic import using static analysis.
       */
      exclude: ['src/models/models.js'],
    }
  },
});
