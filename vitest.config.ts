import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/helpers/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/moodle/**', 'src/tools/**', 'src/config.ts', 'src/errors.ts'],
      exclude: ['src/index.ts'],
      thresholds: {
        lines: 80,
        functions: 90,
        branches: 65,
        statements: 80,
      },
    },
  },
});
