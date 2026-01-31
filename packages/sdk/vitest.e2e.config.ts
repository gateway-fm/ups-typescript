import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        include: ['test/e2e/**/*.test.ts'],
        testTimeout: 120000,
        hookTimeout: 60000,
        globals: true,
    },
    resolve: {
        alias: {
            '@x402-ups/sdk': path.resolve(__dirname, './src'),
        },
    },
});
