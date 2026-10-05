import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    // Database tests share one PostgreSQL/MariaDB database, so test files run one at a time.
    fileParallelism: false,
  },
});
