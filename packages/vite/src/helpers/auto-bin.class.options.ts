import { DEFAULT_OUT_DIR } from '../configs/base-vite.config.js';
import { DEFAULT_SRC_DIR } from '../plugins/autolib.plugin.options.js';
import { ALL_NPM_HOOKS } from './auto-bin.class.js';
import { Logger, noopLogger } from './create-vite-plugin-logger.function.js';

export const DEFAULT_BIN_DIR = 'bin';
export const DEFAULT_BINSHIM_DIR = 'shims';

export interface AutoBinOptions {
	/**
	 * @default process.cwd()
	 */
	cwd?: string;

	/**
	 * @default 'src'
	 */
	srcDir?: string;

	/**
	 * Every script directly in this folder will be treated as a bin
	 *
	 * Relative to `srcDir`.
	 *
	 * @default 'bin'
	 */
	binDir?: string;

	/**
	 * Relative to the package.json, usually './dist'
	 *
	 * used to mark the built scripts as executable
	 *
	 * @default 'dist'
	 */
	outDir?: string;

	/**
	 * A directory where shims for the built bins would be placed
	 * All these scripts do is to import the yet-to-be-built binary so
	 * package managers hava something to symlink to before it's built.
	 *
	 * ! This folder has to be ignored by typescript as it contains broken
	 * ! imports before the package is built
	 *
	 * @default 'shims'
	 */
	shimDir?: string;

	/**
	 * The hooks this function will search for
	 * @default ALL_NPM_HOOKS
	 */
	enabledHooks?: string[];

	/**
	 * An optional logger
	 */
	logger?: Logger;
}

export const normalizeAutoBinOptions = (options: AutoBinOptions): Required<AutoBinOptions> => {
	return {
		cwd: options.cwd ?? process.cwd(),
		srcDir: options.srcDir ?? DEFAULT_SRC_DIR,
		outDir: options.outDir ?? DEFAULT_OUT_DIR,
		binDir: options.binDir ?? DEFAULT_BIN_DIR,
		shimDir: options.shimDir ?? DEFAULT_BINSHIM_DIR,
		enabledHooks: options.enabledHooks ?? ALL_NPM_HOOKS,
		logger: options.logger ?? noopLogger,
	};
};
