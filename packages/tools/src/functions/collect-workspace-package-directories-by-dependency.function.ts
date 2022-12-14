import { collectWorkspacePackageDirectoriesWithPackageJson } from './collect-workspace-package-directories.function.js';

/**
 *
 * @param path
 * @param dependencyCriteria
 * @returns workspace folders that contain a set of dependencies or all of them
 * if none is specified
 */
export const collectWorkspacePageDirectoriesByDependency = async (
	path: string,
	dependencyCriteria: string[] = []
): Promise<string[]> => {
	const packages = await collectWorkspacePackageDirectoriesWithPackageJson(path);
	return packages
		.filter((relativePackage) => {
			const packageDependencies = new Set([
				...Object.keys(relativePackage.packageJson.dependencies ?? {}),
				...Object.keys(relativePackage.packageJson.devDependencies ?? {}),
			]);

			return (
				dependencyCriteria.length === 0 ||
				dependencyCriteria.some((dependency) => packageDependencies.has(dependency))
			);
		})
		.map((relativePackage) => relativePackage.path);
};
