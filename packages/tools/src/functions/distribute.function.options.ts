import type { Logger } from './create-logger.function.js';

export interface DistributeOptions {
	/**
	 * Only distribute to workspace packages that have this dependency listed
	 * in their package.json file. Empty means no filtering is applied.
	 *
	 * @default []
	 */
	dependencyCriteria?: string[];

	/**
	 * The folder where a workspace is searched for, can be anywhere inside
	 * a workspace, the last package.json up the directory tree will mark the
	 * root of the workspace.
	 *
	 * @default process.cwd()
	 */
	cwd?: string;

	/**
	 * Only distribute to the root of the workspace. (Skip all workspace
	 * packages)
	 *
	 * @default false
	 */
	onlyWorkspaceRoot?: boolean;

	/**
	 * Don't distribute to the root of the workspace
	 *
	 * @default false
	 */
	skipWorkspaceRoot?: boolean;

	/**
	 * Instead of copying file, just symlink them.
	 *
	 * @default false
	 */
	symlinkInsteadOfCopy?: boolean;

	/**
	 * Always overwrite target files even if it's occupied or non-autogenerated
	 *
	 * @default false
	 */
	force?: boolean;

	/**
	 * Don't actually do anything just log
	 *
	 * @default false
	 */
	dry?: boolean;

	/**
	 * An optional Logger target
	 *
	 * @default undefined
	 */
	logger?: Logger;
}
