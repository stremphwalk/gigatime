import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules/**', 'dist/**', 'build/**'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
    },
  },
})

