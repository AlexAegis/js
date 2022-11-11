import type { InternalModuleFormat } from 'rollup';
import type { UserConfig } from 'vite';
import type { PackageJsonTarget } from '../plugins/autolib.plugin.options.js';
import type { Awaitable } from './awaitable.type.js';
import type { PackageJson } from './package-json.type.js';

export interface PreparedBuildUpdate {
	/**
	 * Modifies the provided packageJson object.
	 *
	 * A preparation step meant for pre-cleaning the packageJson file.
	 *
	 * Ran parallel together with the same step of other buildUpdates.
	 */
	preUpdate?: (packageJson: PackageJson) => Awaitable<PackageJson>;
	/**
	 * Modifies the provided packageJson object. Meant for heavier tasks.
	 *
	 * Ran parallel together with the same step of other buildUpdates.
	 *
	 * After the `update` step, you can create
	 *
	 * Runs after `preUpdate`
	 */
	update?: (packageJson: PackageJson, format: InternalModuleFormat) => Awaitable<PackageJson>;
	/**
	 * Offsets each path this manages
	 *
	 * Meant to be applied onto multiple copies of the PackageJson file if
	 * more than one is needed.
	 *
	 * Ran parallel together with the same step of other buildUpdates.
	 *
	 * Runs after `update`
	 */
	adjustPaths?: (
		packageJson: PackageJson,
		sourcePackageJsonTarget: PackageJsonTarget,
		format: InternalModuleFormat
	) => Awaitable<PackageJson>;

	/**
	 * Changes applied to the vite build configuration
	 */
	getViteConfigUpdates?: (viteConfig: UserConfig) => Awaitable<Partial<UserConfig>>;
}
