import type { ParsedArgs } from 'minimist';
import type { Options } from '#main';

import { createRequire } from 'module';
import { resolve } from 'path';
import chalk from 'chalk';
import minimist from 'minimist';
import { isSymlinkAvailable, mklnks } from '#main';

const { gray, red } = chalk;
const require = createRequire(import.meta.url);
const { name, version } = require('#@') as typeof import('#@');

const helpText = `
${name} v${version}
Create links as configured.

USAGE:
    $ ${name} [FLAGS]

FLAGS:
    -a, --available         Check if symlinks are available (for Windows).

    -c, --config <FILE>     Run with isolated config file (*.{json|js|cjs|mjs}).

    -d, --dry-run           Run trial execution without actual link creation.
                            (Override \`Options.dryRun\` to \`true\`.)

    -f, --force             Force to remove existing files/directories in the link path.
                            (Override \`Options.force\` to \`true\`.)

    -h, --help              Display this message.

    -q, --quiet             NOT to display logs.
                            (Override \`Options.quiet\` to \`true\`.)

    -s, --silent            NOT to display logs & warnings.
                            (Override \`Options.silent\` to \`true\`.)

    -v, --version           Display version number.

By default, load "${name}" field in \`package.json\` as configurations.
`.trim();

const alias = Object.freeze({
    a: 'available',
    c: 'config',
    d: 'dry-run',
    f: 'force',
    h: 'help',
    q: 'quiet',
    s: 'silent',
    v: 'version',
});

type Args = {
    [P in keyof typeof alias]?: P extends 'c' ? string : true;
} & Readonly<ParsedArgs>;

const args = minimist(process.argv.slice(2), {
    alias,
    boolean: Object.keys(alias).filter(k => k !== 'c'),
    string: ['c']
}) as Args;

const knownFlags = new Set(Object.entries(alias).flat()).add('_').add('--');
const unknownFlags = Object.keys(args).filter(key => !knownFlags.has(key));

await (async () => {
    const options = {} as Options;
    if (0 < unknownFlags.length) {
        console.error(red('Unknown flags:', unknownFlags.join()));
        console.error(gray(`Enter \`${name} --help\``));
        return process.exit(1);
    } else if (args.h) {
        return console.log(helpText);
    } else if (args.v) {
        return console.log(version);
    } else if (args.a) {
        return console.log('Symlink available:', await isSymlinkAvailable());
    } else if ('c' in args) {
        const cfg = args.c;
        if (!cfg) {
            console.error(red('No config file specified.'));
            console.error(gray(`Enter \`${name} --help\``));
            return process.exit(1);
        }
        try {
            Object.assign(options, await loadConfig(cfg));
        } catch (e) {
            console.error(red('Failed to load config:', cfg));
            return process.exit(1);
        }
    } else {
        try {
            const pkg = require(resolve('package.json'));   // eslint-disable-line @typescript-eslint/no-unsafe-assignment
            Object.assign(options, pkg[name]);              // eslint-disable-line @typescript-eslint/no-unsafe-member-access
        } catch (e) {
            console.error(red('Failed to load config:', './package.json'));
            return process.exit(1);
        }
    }
    args.d && (options.dryRun = true);
    args.f && (options.force = true);
    args.q && (options.quiet = true);
    args.s && (options.silent = true);
    try {
        await mklnks(options);
    } catch (e) {
        console.error(red(e));
        process.exit(1);
    }
})();

async function loadConfig(path: string) {
    path = resolve(path);
    if (path.endsWith('js')) {
        const module = await import(path) as { default: Options };
        return module.default;
    } else {
        return require(path) as Options;
    }
}
