import { readdir } from 'node:fs/promises';

import { basename, join } from 'node:path';
import { enterPathPosix } from './enter-path.function.js';
import { existsDirectory } from './exists-directory.function.js';
import { offsetRelativePathPosix } from './offset-relative-path-posix.function.js';
import { stripFileExtension } from './strip-file-extension.function.js';

export const collectImmediate = async (
	path: string = process.cwd(),
	kind?: 'file' | 'directory'
): Promise<string[]> => {
	if (existsDirectory(path)) {
		const entries = await readdir(path, { withFileTypes: true });
		return entries
			.filter((entry) =>
				kind
					? (kind === 'file' && entry.isFile()) ||
					  (kind === 'directory' && entry.isDirectory())
					: true
			)
			.map((entry) => entry.name);
	} else {
		return [];
	}
};

/**
 * @param rootPath path entry will be relative to this
 * @param exportPath path from which files are collected
 */
export const collectFileNamePathEntries = async (
	rootPath: string,
	exportPath = '.'
): Promise<Record<string, string>> => {
	const collectPath = join(rootPath, exportPath);
	const immediateFileNames = await collectImmediate(collectPath, 'file');
	return immediateFileNames.reduce((accumulator, next) => {
		const fileName = basename(next);
		const namestub = stripFileExtension(next);
		accumulator[namestub] = join(exportPath, fileName);
		return accumulator;
	}, {} as Record<string, string>);
};

export const offsetPathArray = (
	pathArray: string[],
	offsetPath: string,
	skipOffset?: string[]
): string[] => {
	return pathArray.map((path) =>
		skipOffset?.includes(path) ? path : offsetRelativePathPosix(offsetPath, path)
	);
};

export const offsetPathRecordValues = (
	pathRecord: Record<string, string>,
	offsetPath: string,
	enterCount = 0,
	skipOffset: string[] = []
): Record<string, string> => {
	return Object.entries(pathRecord).reduce((result, [key, path]) => {
		if (path) {
			const enteredPath = enterPathPosix(path, enterCount);
			if (skipOffset.includes(path)) {
				result[key] = enteredPath;
			} else {
				result[key] = offsetRelativePathPosix(offsetPath, enteredPath);
			}
		}
		return result;
	}, {} as Record<string, string>);
};
/*
export const offsetPackageJsonExports = (
	packageJsonExports: PackageJsonExports,
	offsetPath: string,
	skipOffset?: string[]
): PackageJsonExports => {
	return Object.entries(packageJsonExports).reduce((result, [key, path]) => {
		if (typeof path === 'string') {
			if (skipOffset?.includes(path)) {
				result[key] = path;
			} else {
				result[key] = offsetRelativePathPosix(offsetPath, path);
			}
		} else if (isObject(path)) {
			result[key] = offsetPathRecordValues(path, offsetPath);
		}
		return result;
	}, {} as PackageJsonExports);
};
*/
