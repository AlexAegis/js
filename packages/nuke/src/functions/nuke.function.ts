import { collectWorkspacePackageDirectoriesWithPackageJson } from '@alexaegis/tools';
import { remove } from 'fs-extra';
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

export const DEFAULT_NUKE_LIST: string[] = ['node_modules', 'dist', '.turbo'];

/**
 * Removes a bunch of stuff from packages for cleaning.
 * @param path
 * @param options
 */
export const nuke = async (path: string, options?: NukeOptions): Promise<void> => {
	const packageDirectories = collectWorkspacePackageDirectoriesWithPackageJson(path);

	const nukeList = [...(options?.nukeList ?? DEFAULT_NUKE_LIST), ...(options?.nukeMore ?? [])];
	const skipPackages = options?.dontNukeIn ?? [];
	for (const packageDirectory of packageDirectories) {
		if (
			skipPackages.some((skip) =>
				typeof skip === 'string'
					? skip === packageDirectory.path
					: skip.test(packageDirectory.path)
			)
		) {
			console.info(`[nuke ${packageDirectory.packageJson.name}]: skip...`);
			continue;
		}
		for (const toNuke of nukeList) {
			console.info(`[nuke ${packageDirectory.packageJson.name}]: removing ${toNuke}...`);
			if (!options?.dry) {
				remove(join(packageDirectory.path, toNuke));
			}
		}
	}
};