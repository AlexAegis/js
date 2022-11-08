import { collectWorkspacePackageDirectoriesWithPackageJson } from '@alexaegis/tools';
import { red, yellow } from 'kolorist';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

export interface NukeOptions {
	/**
	 * Don't remove `node_modules` directories but try to clean them up
	 *
	 * @default false
	 */
	skipNodeModules?: boolean;
	/**
	 * Don't actually delete anything, just print out what would be deleted
	 *
	 * @default false
	 */
	dry?: boolean;
	/**
	 * A list of relative paths this script will remove in every package
	 * in the workspace. If you define this, the default are not applied.
	 * If you only wish to extend or remove parts of it use the `nukeMore`
	 * and `dontNuke` fields and leave this alone.
	 * @default DEFAULT_NUKE_LIST
	 */
	nukeList?: string[];
	/**
	 * These will be nuked too. Same role as `nukeList` but defining this
	 * won't get rid of the built in nukelist
	 *
	 * @default []
	 */
	nukeMore?: string[];

	/**
	 * If it shouldn't nuke a specific package, add them here.
	 *
	 * @default []
	 */
	dontNukeIn?: (string | RegExp)[];
}

export const DEFAULT_NUKE_LIST: string[] = [
	'node_modules',
	'dist',
	'.turbo',
	'coverage',
	'package-lock.json',
	'pnpm-lock.yaml',
];

const nukeLogger = (message: string) => console.log(red('[☢ nuke]'), yellow(message));

/**
 * Removes a bunch of stuff from packages for cleaning.
 * @param path
 * @param options
 */
export const nuke = async (path: string, options?: NukeOptions): Promise<void> => {
	const packageDirectories = await collectWorkspacePackageDirectoriesWithPackageJson(path);
	const nukeList = [...(options?.nukeList ?? DEFAULT_NUKE_LIST), ...(options?.nukeMore ?? [])];
	const skipPackages = options?.dontNukeIn ?? [];
	await Promise.all(
		packageDirectories
			.filter(
				(packageDirectory) =>
					!skipPackages.some((skip) =>
						typeof skip === 'string'
							? skip === packageDirectory.path
							: skip.test(packageDirectory.path)
					)
			)
			.flatMap((packageDirectory) =>
				nukeList.map((toNuke) => join(packageDirectory.path, toNuke))
			)
			.filter((nukeTarget) => existsSync(nukeTarget))
			.map((nukeTarget) => {
				nukeLogger('obliterating: ' + nukeTarget);
				return options?.dry
					? false
					: rm(nukeTarget, { recursive: true }).catch(() => false);
			})
	);
};
