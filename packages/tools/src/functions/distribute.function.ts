import { existsSync } from 'node:fs';
import { cp, lstat, readFile, rm, symlink } from 'node:fs/promises';

import { basename, dirname, isAbsolute, join, relative } from 'node:path';
import { collectWorkspacePageDirectoriesByDependency } from './collect-workspace-package-directories-by-dependency.function.js';
import type { DistributeOptions } from './distribute.function.options.js';
import { dry } from './dry.function.js';

export const distribute = async (file: string, options?: DistributeOptions): Promise<void> => {
	const cwd = options?.cwd ?? process.cwd();
	const dependencyCriteria = options?.dependencyCriteria ?? [];
	const onlyWorkspaceRoot = options?.onlyWorkspaceRoot ?? false;
	const skipWorkspaceRoot = options?.skipWorkspaceRoot ?? false;
	const mark = 'autogenerated';

	const filePath = isAbsolute(file) ? file : join(cwd, file);

	const fileName = basename(filePath);

	if (!existsSync(filePath)) {
		options?.logger?.error(`couldn't link '${file}', it doesn't exist`);
		return;
	}

	const fileStats = await lstat(filePath);

	if (!fileStats.isFile()) {
		options?.logger?.error(`couldn't link '${file}', it's not a file`);
		return;
	}

	const targetPackages = await collectWorkspacePageDirectoriesByDependency(
		cwd,
		dependencyCriteria
	);

	if (targetPackages.length === 0) {
		options?.logger?.error(`can't distribute at ${cwd}, not in a workspace`);
		return;
	}

	if (onlyWorkspaceRoot) {
		targetPackages.splice(1);
		options?.logger?.log('distribute to only the workspace root');
	}

	if (skipWorkspaceRoot) {
		targetPackages.shift();
		options?.logger?.log('skip the workspace root');
	}

	options?.logger?.log(
		`packages to check:\n\t${targetPackages
			.map((path) => './' + relative(cwd, path))
			.join('\n\t')}`
	);

	const targetStats = await Promise.all(
		targetPackages
			.map((targetPackage) => join(targetPackage, fileName))
			.map((path) =>
				lstat(path)
					.then((stats) => ({ stats, path }))
					.catch(() => ({ stats: false, path }))
			)
	);

	if (options?.force) {
		options?.logger?.log('force option used, removing all targets before distribution...');
		await Promise.all(
			targetStats.map((target) =>
				target.stats
					? (options.dry ? dry() : rm(target.path)).catch(() => undefined)
					: undefined
			)
		);
	}

	let validTargets: string[];
	if (options?.symlinkInsteadOfCopy) {
		validTargets = targetStats.filter((target) => !target.stats).map((target) => target.path);
	} else {
		// valid if doesnt exist, or a symlink, or its content has an autogenerated mark
		const validPaths = await Promise.all(
			targetStats.map((target) =>
				typeof target.stats === 'object' && !target.stats.isSymbolicLink()
					? readFile(target.path, { encoding: 'utf8' })
							.catch(() => undefined)
							.then((content) => (content?.includes(mark) ? target.path : undefined))
					: target.path
			)
		);
		validTargets = validPaths.filter((path): path is string => !!path);
	}

	await Promise.all(
		validTargets.map((targetFilepath) => {
			if (options?.symlinkInsteadOfCopy) {
				const relativeFromTargetBackToFile = relative(dirname(targetFilepath), filePath);
				return (options.dry ? dry() : symlink(relativeFromTargetBackToFile, targetFilepath))
					.then(() => {
						options?.logger?.log(
							`symlinked ${targetFilepath} to ${relativeFromTargetBackToFile}`
						);
					})
					.catch((error) => {
						options?.logger?.error(`can't link ${file}, error happened: ${error}`);
					});
			} else {
				return (options?.dry ? dry() : cp(filePath, targetFilepath))
					.then(() => {
						options?.logger?.log(`copied ${filePath} to ${targetFilepath}`);
					})
					.catch((error) => {
						options?.logger?.error(`can't copy ${file}, error happened ${error}`);
					});
			}
		})
	);
};
