import { defineConfig } from 'vitest/config';
import { external } from './rollup.config';

const esbuildOptions = Object.freeze({
    format: 'esm',
    minify: true,
    sourcemap: true,
    target: 'node16',
    treeShaking: true,
});

export default defineConfig({
    esbuild: { ...esbuildOptions, minify: undefined as never },
    resolve: {
        alias: [
            { find: /^#(.+)$/, replacement: './src/$1' },
        ],
    },
    test: {
        coverage: {
            reporter: [
                ['text', { file: 'report.txt' }],
                'text',
            ],
        },
        server: {
            deps: {
                external: [...external],
            },
        },
        sequence: {
            concurrent: true,
        },
        testTimeout: 10000,
        threads: false,
    },
});
