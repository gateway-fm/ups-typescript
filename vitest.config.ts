import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./test/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
        include: ['packages/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['**/e2e/**', '**/node_modules/**', '**/dist/**'],
    },
    resolve: {
        alias: {
            '@x402-ups/sdk': path.resolve(__dirname, './packages/sdk/src/index.ts'),
            '@x402-ups/react': path.resolve(__dirname, './packages/react/src/index.ts'),
            '@x402-ups/test-utils': path.resolve(__dirname, './packages/test-utils/src/index.ts'),
        },
    },
});
