/* eslint-disable
    @typescript-eslint/prefer-nullish-coalescing,
 */
import type { MakeDirectoryOptions, RmOptions, Stats } from 'node:fs';
import { LinkInfoInit, LinkType, WorkerData } from '#main';

import { appendFile, link as hardlink, lstat, mkdir, rm, stat, symlink, unlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parentPort, workerData } from 'node:worker_threads';
import chalk from 'chalk';

const { blue, cyan, gray, green, magenta, white, yellow } = chalk;
const { dryRun, force, preferSymlink, quiet, silent } = workerData as WorkerData;

const STR_PREFIX = green(dryRun ? '? ' : '+ ');
const STR_ARROW = gray(' » ');

const mkdirOptions = Object.freeze({ recursive: true } as MakeDirectoryOptions);
const rmOptions = Object.freeze({ force: true, recursive: true } as RmOptions);

parentPort?.on('message', async (message: readonly [string, string]) => {
    const [linkPath, target] = message;
    const result = await mklnk(linkPath, target);
    parentPort!.postMessage(result);
});

async function mklnk(linkPath: string, target: string) {

    if (!linkPath || !target) {
        throw new TypeError('Invalid Arguments');
    }

    const targetPath = await parseTarget(target);
    const result = { dryRun, linkPath, targetPath } as LinkInfoInit;

    if (linkPath === targetPath) {
        silent || console.warn(yellow('Link & Target refer to same location:', toPOSIX(linkPath)));
        result.type = LinkType.NONE;
        return result;
    }

    const getStats = [
        lstat(linkPath).catch(noop),
        stat(targetPath).catch(noop),
    ] as Promise<Stats | undefined>[];

    const definitelyDir = /[/\\]$/.test(target);
    const linkParentDirPath = dirname(linkPath);
    const preparations = [] as Promise<unknown>[];
    const strLink = toPOSIX(linkPath);
    const strTarget = toPOSIX(targetPath);

    const [linkStat, targetStat] = await Promise.all(getStats);
    const isDir = targetStat?.isDirectory() ?? definitelyDir;

    if (preferSymlink) {
        result.type = isDir ? LinkType.SYMLINK_DIR : LinkType.SYMLINK_FILE;
    } else if (isDir) {
        result.type = LinkType.JUNCTION_DIR;
    } else {
        if (!targetStat) {
            dryRun || preparations.push(safeTouch(targetPath));
            silent || console.warn(yellow('Create empty hardlink target:', strTarget));
        }
        result.type = LinkType.HARDLINK_FILE;
    }

    if (dryRun) {
        // NOOP
    } else if (!linkStat) {
        preparations.push(mkdir(linkParentDirPath, mkdirOptions));
    } else if (force) {
        preparations.push(rm(linkPath, rmOptions));
    } else if (linkStat.isSymbolicLink() || 1 < linkStat.nlink) {
        preparations.push(unlink(linkPath));
    } else {
        throw new Error(`EEXIST: ${strLink}`);
    }

    const relativePath = relative(linkParentDirPath, targetPath);
    let createLink: true | Promise<void>;
    let logText: string;

    await Promise.all(preparations);

    switch (result.type) {
        case LinkType.SYMLINK_DIR:
            createLink = dryRun || symlink(relativePath, linkPath, 'dir');
            logText = STR_PREFIX + cyan(strLink) + STR_ARROW + blue(strTarget) + '/';
            break;
        case LinkType.SYMLINK_FILE:
            createLink = dryRun || symlink(relativePath, linkPath, 'file');
            logText = STR_PREFIX + cyan(strLink) + STR_ARROW + white(strTarget);
            break;
        case LinkType.JUNCTION_DIR:
            createLink = dryRun || symlink(targetPath, linkPath, 'junction');
            logText = STR_PREFIX + magenta(strLink) + STR_ARROW + blue(strTarget) + '/';
            break;
        case LinkType.HARDLINK_FILE:
            createLink = dryRun || hardlink(targetPath, linkPath);
            logText = STR_PREFIX + yellow(strLink) + STR_ARROW + white(strTarget);
            break;
        default:
            throw new Error('Unexpected Exception');
    }

    await createLink;
    quiet || console.log(logText);

    return result;
}

function noop() { /* NOOP */ }

const cwd = process.cwd() + sep;
const cwdUrl = pathToFileURL(cwd).href;
const require = createRequire(cwd);

async function parseTarget(s: string) {
    const enum Prefix {
        IMPORT  = 'import:',
        REQUIRE = 'require:',
    }
    const enum PrefixLength {
        IMPORT  = 7,    // Prefix.IMPORT.length
        REQUIRE = 8,    // Prefix.REQUIRE.length
    }
    if (s.startsWith(Prefix.IMPORT)) {
        const id = s.slice(PrefixLength.IMPORT);
        const url = await import.meta.resolve!(id, cwdUrl);
        return fileURLToPath(url);
    } else if (s.startsWith(Prefix.REQUIRE)) {
        const id = s.slice(PrefixLength.REQUIRE);
        return require.resolve(id);
    } else {
        return resolve(s);
    }
}

async function safeTouch(path: string) {
    await mkdir(dirname(path), mkdirOptions);
    await appendFile(path, '');
}

function toPOSIX(path: string, from = '.') {
    path = relative(from, path);
    return sep === '\\' ? path.replace(/\\/g, '/') : path;
}
