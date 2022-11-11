import { posix } from 'node:path';
import { DEFAULT_OUT_DIR } from '../index.js';
import type { PackageJsonTarget } from '../plugins/autolib.plugin.options.js';
import { DEFAULT_BINSHIM_DIR, DEFAULT_BIN_DIR } from './auto-bin.class.options.js';
import { enterPathPosix } from './enter-path.function.js';
import { offsetRelativePathPosix } from './offset-relative-path-posix.function.js';

export interface RetargetPackageJsonOptions {
	packageJsonTarget: PackageJsonTarget;
	/**
	 * @default 'dist'
	 */
	outDir?: string;

	/**
	 * @default 'shims'
	 */
	shimDir?: string;

	/**
	 * @default 'bin
	 */
	binDir?: string;
}

/**
 * This function should be able to turn a relative path from cwd pointing to
 * a source file, into a path that will point to a
 * different projection of the same file, like it's built equivalent or its
 * shim
 *
 * @returns
 */
export const retargetPackageJsonPath = (
	path: string,
	options: RetargetPackageJsonOptions
): string => {
	const outDir = options.outDir ?? DEFAULT_OUT_DIR;
	const binDir = options.binDir ?? DEFAULT_BIN_DIR;
	const shimDir = options.shimDir ?? DEFAULT_BINSHIM_DIR;
	let offsetPath = '';
	let enterCount = 0;
	switch (options.packageJsonTarget) {
		case 'out-to-out': {
			offsetPath = '';
			enterCount = 1;
			break;
		}
		case 'out': {
			offsetPath = outDir;
			enterCount = 1;
			break;
		}
		case 'source': {
			offsetPath = '';
			enterCount = 0;
			break;
		}
		case 'shim': {
			offsetPath = shimDir;
			enterCount = 1 + posix.normalize(binDir).split(posix.sep).length;
			break;
		}
	}
	const enteredPath = enterPathPosix(path, enterCount);
	return offsetRelativePathPosix(offsetPath, enteredPath);
};
