import { DEFAULT_BINSHIM_DIR, DEFAULT_BIN_DIR } from '../helpers/auto-bin.class.options.js';
import { DEFAULT_ENTRY_DIR } from '../helpers/auto-entry.class.options.js';
import { DEFAULT_STATIC_EXPORT_GLOBS } from '../helpers/auto-export-static.class.options.js';
import type { WriteJsonOptions } from '../helpers/write-json.function.js';

export const DEFAULT_SRC_DIR = 'src';

export type SourcePackageJsonTarget = 'source' | 'out';
export type PackageJsonTarget = SourcePackageJsonTarget | 'out-to-out' | 'shim';

export interface AutolibPluginOptions extends WriteJsonOptions {
	/**
	 * source root, relative to cwd
	 * @default 'src'
	 */
	src?: string;

	/**
	 * The directory of the package
	 * @default process.cwd()
	 */
	cwd?: string;

	/**
	 * packageJson to modify and put in the artifact, relative to `cwd`
	 * @default './package.json'
	 */
	sourcePackageJson?: string;

	/**
	 * Whether or not to transform the source package json and in what manner.
	 * Useful in a monorepo where you want to use the library in
	 * other packages.
	 * It's best to let `autoPrettier` be enabled if this is enabled as the
	 * file would get minified otherwise.
	 *
	 * Using `build` targets everything to the `outDir` of your build.
	 * This implies that your library is always built and rebuilt when using
	 * it. It's extremely useful as you will use the exact form of your library
	 * as your consumers would and you can catch packaging problems early.
	 *
	 * Using `source` targets everything into your source folder and runs them
	 * using node with tsnode registered. This is useful when you want a local
	 * library with hooks to act during installation.
	 *
	 * @default 'source'
	 */
	packageJsonTarget?: SourcePackageJsonTarget | false;

	/**
	 * Generates exports entries form rollup inputs, from a directory relative
	 * to `srcDir`
	 *
	 * If autoExport is disabled, the plugin expects you to either set
	 * `build.lib.entry` yourself or have a `src/index.ts` file as the entry
	 * point
	 *
	 * @default '["."]'
	 */
	autoEntryDir?: string | false;

	/**
	 * Automatically export the content of a directory as is
	 *
	 * @default '["export/**", "static/**"]'
	 */
	autoExportStaticGlobs?: string[] | false;

	/**
	 * Generates bin entries from files under `srcDir` + `autoBinDirectory`
	 * It also treats all files named as npm hooks as npm hooks, prefixing them
	 * and adding them as hooks for the npm artifact
	 *
	 * For example a file called `postinstall.ts` in a package called
	 * `@org/name`, it will generate an npm script entry as such:
	 * `"postinstall": "bin/postinstall.js"`. The hook is still treated as a
	 * `bin` so you can invoke it directly. To avoid name collisions, all
	 * "hookbins" are prefixed with the normalized packagename like so:
	 * `org-name-postinstall`
	 *
	 * @default '["./bin/*.ts"]'
	 */
	autoBin?: AutoLibraryAutoBinOptions | false;
}

export const normalizeAutolibOptions = (
	options?: AutolibPluginOptions
): Required<AutolibPluginOptions> => {
	return {
		autoBin: normalizeAutoBinOption(options?.autoBin),
		autoEntryDir:
			options?.autoEntryDir === false ? false : options?.autoEntryDir ?? DEFAULT_ENTRY_DIR,
		autoExportStaticGlobs:
			options?.autoExportStaticGlobs === false
				? false
				: options?.autoExportStaticGlobs ?? DEFAULT_STATIC_EXPORT_GLOBS,
		sourcePackageJson: options?.sourcePackageJson ?? 'package.json',
		cwd: options?.cwd ?? process.cwd(),
		dry: options?.dry ?? false,
		autoPrettier: options?.autoPrettier ?? true,
		packageJsonTarget: options?.packageJsonTarget ?? 'source',
		src: options?.src ?? DEFAULT_SRC_DIR,
	};
};

interface AutoLibraryAutoBinOptions {
	binDir?: string;
	shimDir?: string;
}

const normalizeAutoBinOption = (
	autoBin?: AutoLibraryAutoBinOptions | false
): Required<AutoLibraryAutoBinOptions> | false => {
	return autoBin === false
		? false
		: {
				binDir: autoBin?.binDir ?? DEFAULT_BIN_DIR,
				shimDir: autoBin?.shimDir ?? DEFAULT_BINSHIM_DIR,
		  };
};
