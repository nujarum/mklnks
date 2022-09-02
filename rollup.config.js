import { builtinModules } from 'module';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-ts';

const external = Object.freeze([
    ...builtinModules,
    /([/\\])node_modules\1/,
    /^#.+/,
]);
const outputDeclaration = Object.freeze({
    declaration: true,
    declarationDir: './types',
    declarationMap: true,
});
const terserOptions = Object.freeze({
    compress: false,
    // format: { beautify: true },  // for debug
    ecma: 2022,
});

export default [
    {
        input: 'src/main.ts',
        external,
        output: {
            file: 'dist/main.js',
            format: 'es',
            preferConst: true,
            sourcemap: true,
        },
        plugins: [
            nodeResolve(),
            typescript({
                tsconfig: cfg => ({
                    ...cfg,
                    ...outputDeclaration,
                }),
            }),
            terser(terserOptions),
        ],
    },
    {
        input: 'src/worker.ts',
        external,
        output: {
            file: 'dist/worker.js',
            format: 'es',
            preferConst: true,
            sourcemap: true,
        },
        plugins: [
            nodeResolve(),
            typescript(),
            terser(terserOptions),
        ],
    },
    {
        input: 'src/cli.ts',
        external,
        output: {
            banner: '#!/usr/bin/env node',
            file: 'bin/cli.js',
            format: 'es',
            preferConst: true,
            sourcemap: true,
        },
        plugins: [
            nodeResolve(),
            typescript(),
            terser(terserOptions),
        ],
    },
];
