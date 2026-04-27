import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    setupFiles: ['./src/tests/setup/test-env.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      lines: 60,
      statements: 60,
      functions: 60,
      branches: 50,
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/utils/custom.d.ts', 'src/utils/types.d.ts'],
    },
  },
});
