<h1>mklnks</h1>

Create links as configured.

[![npm](https://badgen.net/npm/v/mklnks)](https://www.npmjs.com/package/mklnks)
[![downloads](https://badgen.net/npm/dt/mklnks)](https://www.npmjs.com/package/mklnks)
[![install size](https://packagephobia.com/badge?p=mklnks)](https://packagephobia.com/result?p=mklnks)
[![license](https://badgen.net/npm/license/mklnks)](https://github.com/nujarum/mklnks/blob/main/LICENSE)
[![node](https://badgen.net/npm/node/mklnks)](https://nodejs.org/)
[![types](https://badgen.net/npm/types/mklnks)](https://github.com/nujarum/mklnks/blob/main/types/main.d.ts)
[![vulnerabilities](https://snyk.io/test/github/nujarum/mklnks/badge.svg?targetFile=package.json)](https://github.com/nujarum/mklnks/network/dependencies)
[![CodeQL](https://github.com/nujarum/mklnks/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/nujarum/mklnks/actions/workflows/codeql-analysis.yml)

- [API](#api)
    - [`Options`](#options)
        - [`baseDir`](#basedir)
        - [`dryRun`](#dryrun)
        - [`entries`](#entries)
        - [`force`](#force)
        - [`noSymlink` **(Windows only)**](#nosymlink-windows-only)
        - [`quiet`](#quiet)
        - [`silent`](#silent)
    - [`LinkInfo`](#linkinfo)
- [CLI](#cli)
- [Configurations](#configurations)
    - [with current `package.json`](#with-current-packagejson)
    - [with isolated config file (`*.{json|js|cjs|mjs}`)](#with-isolated-config-file-jsonjscjsmjs)

-----

# API

See also [`main.d.ts`](https://github.com/nujarum/mklnks/blob/main/types/main.d.ts).

```ts
function mklnks(options: Options): Promise<LinkInfo[]>;
```

## `Options`

### `baseDir`
Base path for resolving paths.
* Type: `string`
* Default: `'.'` (== [`process.cwd()`](https://nodejs.org/docs/latest-v18.x/api/process.html#processcwd))

### `dryRun`
Run trial execution without actual link creation.
* Type: `boolean`
* Default: `false`

### `entries`
An object mapping link path to target path.
* Type: `Record<string, string>`
* Supported link formats:
    * absolute/relative path
* Supported target formats:
    * absolute/relative path
    * `import:<id>` (resolve by [`import.meta.resolve`](https://nodejs.org/docs/latest-v18.x/api/esm.html#importmetaresolvespecifier-parent))
    * `require:<id>` (resolve by [`require.resolve`](https://nodejs.org/docs/latest-v18.x/api/modules.html#requireresolverequest-options))

### `force`
Force to remove existing files/directories in the link path.
* Type: `boolean`
* Default: `false`

### `noSymlink` **(Windows only)**
Create links with junctions/hard-links instead of symlinks.
* Type: `boolean`
* Default: `false`

> **Note** :<br/>
> This option is only available on Windows and ignored on other platforms.<br/>
> On Windows, `mklnks` will automatically fallback to junctions/hard-links if the environment has no permission to create symlinks[^1].<br/>
> Set this option to `true` only if you want to avoid symlinks explicitly.

> [^1]: See [here](https://blogs.windows.com/windowsdeveloper/2016/12/02/symlinks-windows-10/) to create/modify symlinks without elevating as administrator on Windows.

### `quiet`
**Not** to display logs.
* Type: `boolean`
* Default: The value of `silent`

### `silent`
**Not** to display logs & warnings.
* Type: `boolean`
* Default: `false`


## `LinkInfo`
`mklnks` returns a `Promise` that resolves to an array of `LinkInfo`.

`LinkInfo` has the following properties.

| Name         | Type      | Description                                                                                                       |
| ------------ | --------- | ----------------------------------------------------------------------------------------------------------------- |
| `dryRun`     | `boolean` | `true` if run with `Options.dryRun: true`                                                                         |
| `isAnyLink`  | `boolean` | `true` if any link has created. `false` if otherwise<br/>(e.g. `linkPath` & `targetPath` refer to same location). |
| `isDirLink`  | `boolean` | `true` if the link created is directory link.                                                                     |
| `isFileLink` | `boolean` | `true` if the link created is file link.                                                                          |
| `isHardLink` | `boolean` | `true` if the link created is hard-link.                                                                          |
| `isJunction` | `boolean` | `true` if the link created is junction.                                                                           |
| `isSoftLink` | `boolean` | `true` if the link created is soft-link (junction or symlink).                                                    |
| `isSymLink`  | `boolean` | `true` if the link created is symlink.                                                                            |
| `linkPath`   | `string`  | The path of link source.                                                                                          |
| `targetPath` | `string`  | The path of link tareget.                                                                                         |


# CLI

See also `mklnks --help` output.

```shell-session
USAGE:
    $ mklnks [FLAGS]

FLAGS:
    -a, --available         Check if symlinks are available (for Windows).

    -c, --config <FILE>     Run with isolated config file (*.{json|js|cjs|mjs}).

    -d, --dry-run           Run trial execution without actual link creation.
                            (Override `Options.dryRun` to `true`.)

    -f, --force             Force to remove existing files/directories in the link path.
                            (Override `Options.force` to `true`.)

    -h, --help              Display this message.

    -q, --quiet             NOT to display logs.
                            (Override `Options.quiet` to `true`.)

    -s, --silent            NOT to display logs & warnings.
                            (Override `Options.silent` to `true`.)

    -v, --version           Display version number.

By default, load "mklnks" field in `package.json` as configurations.
```

# Configurations

## with current `package.json`
```json
{
    "name": "your-package-name",
    "description": "...",
    "version": "...",
    ...,
    "mklnks": {
        // mklnks options
        "entries": {
            "path/to/link1": "path/to/target1",
            "path/to/link2": "import:some-exported-id",
            "path/to/link3": "require:some-exported-id",
            ...
        }
    },
}
```

## with isolated config file (`*.{json|js|cjs|mjs}`)
> specify with `-c` flag
* JSON style (`*.json`)
    ```json
    {
        "entries": {
            "path/to/link1": "path/to/target1",
            "path/to/link2": "import:some-exported-id",
            "path/to/link3": "require:some-exported-id",
            ...
        }
    }
    ```
* CommonJS style (`*.js`/`*.cjs`)
    ```js
    module.exports = {
        entries: {
            'path/to/link1': 'path/to/target1',
            'path/to/link2': 'import:some-exported-id',
            'path/to/link3': 'require:some-exported-id',
            ...
        },
    };
    ```
* ECMAScript style (`*.js`/`*.mjs`)
    ```js
    export default {
        entries: {
            'path/to/link1': 'path/to/target1',
            'path/to/link2': 'import:some-exported-id',
            'path/to/link3': 'require:some-exported-id',
            ...
        },
    };
    ```
