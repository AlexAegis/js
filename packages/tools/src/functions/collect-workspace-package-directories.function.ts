import type { JSONSchemaForNPMPackageJsonFiles as PackageJson } from '@schemastore/package';
import { globby } from 'globby';
import { join } from 'node:path';
import { collectPackageJsonLocationsLinearly } from './collect-package-json-locations-linearly.function.js';
import { readJson } from './read-json.function.js';
import { readYaml } from './read-yaml.function.js';

export interface RelativePackage {
	path: string;
	packageJson: PackageJson;
}

export const collectWorkspacePackageDirectoriesWithPackageJson = async (
	path: string
): Promise<RelativePackage[]> => {
	const packages = collectPackageJsonLocationsLinearly(path);
	const rootWorkspace = packages[0];
	const packageJson = await readJson<PackageJson>(join(rootWorkspace, 'package.json'));

	if (packageJson) {
		const rootPackage: RelativePackage = {
			path: rootWorkspace,
			packageJson,
		};

		const pnpmWorkspace = await readYaml<{ workspaces?: string[] }>(
			join(rootWorkspace, 'pnpm-workspace.yaml')
		);

		let workspaces = packageJson.workspaces ?? [];

		if (pnpmWorkspace?.workspaces) {
			workspaces = [...workspaces, ...pnpmWorkspace.workspaces];
		}

		console.log('WORKSPACES', workspaces);
		if (workspaces.length > 0) {
			const paths = await globby(workspaces, {
				gitignore: true,
				onlyDirectories: true,
				ignore: ['node_modules'],
				absolute: true,
				cwd: rootWorkspace,
			});

			console.log('paths', paths);

			const potentialSubPackages = await Promise.all(
				paths.map((path) =>
					readJson(join(path, 'package.json')).then((packageJson) => ({
						packageJson,
						path,
					}))
				)
			);

			const subPackages = potentialSubPackages.filter(
				(relativePackage): relativePackage is RelativePackage =>
					!!relativePackage.packageJson
			);

			return [rootPackage, ...subPackages];
		} else {
			return [rootPackage];
		}
	} else {
		return [];
	}
};

export const collectWorkspacePackageDirectories = async (path: string): Promise<string[]> => {
	const subPackages = await collectWorkspacePackageDirectoriesWithPackageJson(path);
	return subPackages.map((relativePackage) => relativePackage.path);
};
