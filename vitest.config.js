import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './tests/setup/setup.js',
    testMatch: ['**/*.test.js'],
    isolate: true,
    coverage: {
      provider: 'istanbul',
      reporter: ['html', 'text'],
      outputFile: {
        html: 'coverage/html',
        text: 'coverage/text',
      },
      include: ['src/**/*.{js,ts}'],
    },
  },
  resolve: {
    alias: {
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
  env: {
    NODE_ENV: 'test',
  },
});