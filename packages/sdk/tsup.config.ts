import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/index.ts',
        'src/wallet/index.ts',
        'src/account/index.ts',
        'src/payment/index.ts'
    ],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false, // Easier for debugging initially
});
