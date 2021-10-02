interface LinkInfo {
    /** `true` if run with `Options.dryRun: true` */
    readonly dryRun?: boolean;
    /** `true` if any link has created. `false` if otherwise (e.g. `targetPath` & `linkPath` refer to same location). */
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
     * @default '.' (== process.cwd())
     */
    baseDir?: string;
    /**
     * Run trial execution without actual link creation.
     * @default false
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
     * * `import:<id>` (resolve by [`import.meta.resolve`](https://nodejs.org/dist/latest-v16.x/docs/api/esm.html#esm_import_meta_resolve_specifier_parent))
     * * `require:<id>` (resolve by [`require.resolve`](https://nodejs.org/dist/latest-v16.x/docs/api/modules.html#modules_require_resolve_request_options))
     */
    entries: Record</* link */ string, /* target */ string>;
    /**
     * Force to remove existing files/directories in the link path.
     * @default false
     */
    force?: boolean;
    /**
     * **(Windows only)**
     *
     * Create links with junctions/hard-links instead of symlinks.
     * @default false
     */
    noSymlink?: boolean;
    /**
     * **Not** to display logs.
     * @default silent
     */
    quiet?: boolean;
    /**
     * **Not** to display logs & warnings.
     * @default false
     */
    silent?: boolean;
}
declare function isSymlinkAvailable(): Promise<boolean>;
declare function mklnks(options: Options): Promise<LinkInfo[]>;
export { LinkInfo, Options, isSymlinkAvailable, mklnks };
//# sourceMappingURL=main.d.ts.map