/* eslint-disable
    @typescript-eslint/no-floating-promises,
 */
import type { MakeDirectoryOptions } from 'node:fs';
import { lstat, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import { beforeAll, expect, test } from '@jest/globals';
import { LinkInfo, Options, isSymlinkAvailable, mklnks } from '#main';

const baseDir = fileURLToPath(new URL('.tmp', import.meta.url));
const mkdirOptions = Object.freeze({ recursive: true } as MakeDirectoryOptions);

beforeAll(async () => {
    await mkdir(baseDir, mkdirOptions);
});

test('isSymlinkAvailable', async () => {
    const result = await isSymlinkAvailable();
    expect(typeof result).toBe('boolean');
});

test('mklnks', async () => {
    const enum LinkName {
        DIR     = 'dir-link',
        IMPORT  = 'import-link',
        REQUIRE = 'require-link',
    }
    const options: Options = {
        baseDir,
        entries: {
            [LinkName.DIR]: 'directory-target/',
            [LinkName.IMPORT]: 'import:rollup',
            [LinkName.REQUIRE]: 'require:rollup',
        },
    };
    const [
        dirLinkInfo,
        importLinkInfo,
        requireLinkInfo,
    ] = await mklnks(options) as [LinkInfo, LinkInfo, LinkInfo];
    expect(dirLinkInfo.isAnyLink).toBe(true);
    expect(dirLinkInfo.isDirLink).toBe(true);
    expect(dirLinkInfo.isSoftLink).toBe(true);
    expect(importLinkInfo.isAnyLink).toBe(true);
    expect(importLinkInfo.isFileLink).toBe(true);
    expect(requireLinkInfo.isAnyLink).toBe(true);
    expect(requireLinkInfo.isFileLink).toBe(true);
    const [dirLinkStat, importLinkStat, requireLinkStat] = await Promise.all([
        lstat(resolve(baseDir, LinkName.DIR))!,
        lstat(resolve(baseDir, LinkName.IMPORT))!,
        lstat(resolve(baseDir, LinkName.REQUIRE))!,
    ]);
    expect(dirLinkStat.isSymbolicLink()).toBe(true);
    expect(importLinkStat.isSymbolicLink() || 1 < importLinkStat.nlink).toBe(true);
    expect(requireLinkStat.isSymbolicLink() || 1 < requireLinkStat.nlink).toBe(true);
});

test('mklnks dry-run', async () => {
    const options: Options = {
        baseDir,
        dryRun: true,
        entries: {
            'link': 'target',
        },
    };
    const [result] = await mklnks(options);
    expect(result!.dryRun).toBe(true);
});

test('mklnks throw if duplicate links', () => {
    const enum LinkName {
        LINK0 = 'link',
        LINK1 = 'link/../link',
    }
    const options: Options = {
        baseDir,
        entries: {
            [LinkName.LINK0]: 'target',
            [LinkName.LINK1]: 'target',
        },
    };
    expect(mklnks(options)).rejects.toThrow();
});
