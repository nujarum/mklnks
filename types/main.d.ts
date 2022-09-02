interface LinkInfo {
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
interface Options {
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
declare function isSymlinkAvailable(): Promise<boolean>;
declare function mklnks(options: Options): Promise<LinkInfo[]>;
export { LinkInfo, Options, isSymlinkAvailable, mklnks };
//# sourceMappingURL=main.d.mts.map