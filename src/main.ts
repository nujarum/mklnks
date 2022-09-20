import type { RmOptions } from 'node:fs';
import type { WorkerOptions } from 'node:worker_threads';

import { once } from 'node:events';
import { rm, symlink } from 'node:fs/promises';
import { cpus, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { importMetaResolve } from 'resolve-esm';
import chalk from 'chalk';
const { gray } = chalk;

const getWorkerUrl = importMetaResolve('#worker'); // import.meta.resolve('#worker');
const isWindows = process.platform === 'win32';
const symlinkAvailable = availableSymlink();

const cpuCount = cpus().length;
const execArgv = Object.freeze([
    '--experimental-import-meta-resolve',
]);
const workerPath = fileURLToPath(await getWorkerUrl);

/** @internal */
export interface LinkInfoInit {
    dryRun?: boolean;
    linkPath: string;
    targetPath: string;
    type: LinkType;
}

/** @internal */
export const enum LinkType {
    NONE            = 0b00000000,
    DIR_LINK        = 0b00000001,
    FILE_LINK       = 0b00000010,
    SYMLINK         = 0b00000100,
    JUNCTION        = 0b00001000,
    SOFTLINK        = SYMLINK | JUNCTION,
    HARDLINK        = 0b00010000,
    SYMLINK_DIR     = SYMLINK | DIR_LINK,
    SYMLINK_FILE    = SYMLINK | FILE_LINK,
    JUNCTION_DIR    = JUNCTION | DIR_LINK,
    HARDLINK_FILE   = HARDLINK | FILE_LINK,
}

/** @internal */
export interface WorkerData {
    readonly dryRun?: boolean | undefined;
    readonly force?: boolean | undefined;
    readonly preferSymlink?: boolean | undefined;
    readonly quiet?: boolean | undefined;
    readonly silent?: boolean | undefined;
}

export interface LinkInfo {
    /** `true` if run with `Options.dryRun: true` */
    readonly dryRun?: boolean;
    /** `true` if any link has created. `false` if otherwise (e.g. `linkPath` & `targetPath` refer to same location). */
    readonly isAnyLink: boolean;
    /** `true` if the link created is directory link. */
    readonly isDirLink: boolean;
    /** `true` if the link created is file link. */
    readonly isFileLink: boolean;
    /** `true` if the link created is hard-link. */
    readonly isHardLink: boolean;
    /** `true` if the link created is junction. */
    readonly isJunction: boolean;
    /** `true` if the link created is soft-link (junction or symlink). */
    readonly isSoftLink: boolean;
    /** `true` if the link created is symlink. */
    readonly isSymLink: boolean;
    /** The path of link source. */
    readonly linkPath: string;
    /** The path of link tareget. */
    readonly targetPath: string;
}

export interface Options {
    /**
     * Base path for resolving paths.
     * @defaultValue `"."` (== [`process.cwd()`](https://nodejs.org/dist/latest-v16.x/docs/api/process.html#processcwd))
     */
    baseDir?: string;
    /**
     * Run trial execution without actual link creation.
     * @defaultValue `false`
     */
    dryRun?: boolean;
    /**
     * An object mapping link path to target path.
     *
     * Supported link formats:
     * * absolute/relative path
     *
     * Supported target formats:
     * * absolute/relative path
     * * `import:<id>` (resolve by [`import.meta.resolve`](https://nodejs.org/dist/latest-v16.x/docs/api/esm.html#importmetaresolvespecifier-parent))
     * * `require:<id>` (resolve by [`require.resolve`](https://nodejs.org/dist/latest-v16.x/docs/api/modules.html#requireresolverequest-options))
     */
    entries: Record</* link */ string, /* target */ string>;
    /**
     * Force to remove existing files/directories in the link path.
     * @defaultValue `false`
     */
    force?: boolean;
    /**
     * **(Windows only)**
     *
     * Create links with junctions/hard-links instead of symlinks.
     * @defaultValue `false`
     */
    noSymlink?: boolean;
    /**
     * **Not** to display logs.
     * @defaultValue The value of {@linkcode silent}
     */
    quiet?: boolean;
    /**
     * **Not** to display logs & warnings.
     * @defaultValue `false`
     */
    silent?: boolean;
}

class _LinkInfo implements LinkInfo {
    constructor(init: LinkInfoInit) {
        const properties: PropertyDescriptorMap = Object.getOwnPropertyDescriptors(init);
        Object.values(properties).forEach(p => p.writable = false);
        Object.defineProperties(this, properties);
    }
    get [Symbol.toStringTag]() { return 'LinkInfo' as const; }
    get isAnyLink()     { return LinkType.NONE < this.type; }
    get isDirLink()     { return !!(this.type & LinkType.DIR_LINK); }
    get isFileLink()    { return !!(this.type & LinkType.FILE_LINK); }
    get isHardLink()    { return !!(this.type & LinkType.HARDLINK); }
    get isJunction()    { return !!(this.type & LinkType.JUNCTION); }
    get isSoftLink()    { return !!(this.type & LinkType.SOFTLINK); }
    get isSymLink()     { return !!(this.type & LinkType.SYMLINK); }
}
interface _LinkInfo extends Readonly<LinkInfoInit> { // eslint-disable-line @typescript-eslint/no-empty-interface
}

export function isSymlinkAvailable() {
    return symlinkAvailable;
}

export async function mklnks(options: Options) {
    const cwd = process.cwd();
    options = { ...options };
    options.noSymlink &&= isWindows;
    options.quiet     ||= options.silent!;
    const {
        baseDir = '.',
        dryRun,
        entries = {},
        force,
        noSymlink,
        quiet,
        silent,
    } = options;

    const workers: Worker[] = [];
    try {
        process.chdir(baseDir);

        const entryMap = listEntries(entries);
        const { size } = entryMap;
        if (size < 1) {
            quiet || console.log(gray('No valid entries.'));
            return [];
        }
        {
            const n = workers.length = Math.min(cpuCount, size);
            const preferSymlink = !noSymlink && await symlinkAvailable;
            const workerData: WorkerData = { dryRun, force, preferSymlink, quiet, silent };
            const workerOptions = { execArgv, workerData } as WorkerOptions;
            for (let i = 0; i < n; workers[i++] = new Worker(workerPath, workerOptions));
        }
        const entryList: (readonly [string, string])[] = [...entryMap];
        const resultMap = new Map(entryList.map(([linkPath]) => [linkPath, null! as LinkInfo]));
        const run = exec.bind(null, entryList.reverse(), resultMap);

        await Promise.all(workers.map(run));

        return [...resultMap.values()];

    } finally {
        workers.forEach(w => void w.terminate());
        process.chdir(cwd);
    }
}

async function availableSymlink() {
    if (!isWindows) {
        return true;
    }
    const rmOptions: RmOptions = { force: true, recursive: true };
    const tmpPath = join(tmpdir(), (Date.now() + Math.random()).toString(36).padEnd(12, '0'));
    try {
        await rm(tmpPath, rmOptions);
        await symlink(tmpPath + '.tmp', tmpPath, 'file');
        return true;
    } catch (e) {
        return false;
    } finally {
        void rm(tmpPath, rmOptions);
    }
}

async function exec(entryList: (readonly [string, string])[], resultMap: Map<string, LinkInfo>, worker: Worker) {
    while (0 < entryList.length) {
        worker.postMessage(entryList.pop());
        const [result] = await once(worker, 'message') as [LinkInfoInit];
        resultMap.set(result.linkPath, new _LinkInfo(result));
    }
}

function listEntries(srcEntries: Readonly<Record<string, string>>) {
    const srcList = Object.entries(srcEntries);
    const entryMap = new Map<string, string>();
    for (const [link, target] of srcList) {
        const linkPath = resolve(link);
        if (entryMap.has(linkPath)) {
            const i = [...entryMap.keys()].indexOf(linkPath);
            const [link0] = srcList[i]!;
            throw new Error(`Duplicate Links: "${link0}" == "${link}"`);
        }
        entryMap.set(linkPath, target);
    }
    return entryMap;
}
