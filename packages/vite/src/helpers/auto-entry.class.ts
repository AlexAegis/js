import { join, posix } from 'node:path';
import type { UserConfig } from 'vite';
import type { PackageJsonTarget } from '../plugins/autolib.plugin.options.js';
import { getBundledFileExtension } from './append-bundle-file-extension.function.js';
import { AutoEntryOptions, normalizeAutoEntryOptions } from './auto-entry.class.options.js';
import { collectImmediate, offsetPathRecordValues } from './collect-export-entries.function.js';
import { createPathRecordFromPaths } from './create-path-record-from-paths.function.js';
import type { PackageJsonExportConditions } from './package-json-export-conditions.type.js';
import type { PackageJson, PackageJsonExports } from './package-json.type.js';
import type { PreparedBuildUpdate } from './prepared-build-update.type.js';
import { retargetPackageJsonPath } from './retarget-package-json-path.function.js';
import { stripFileExtension } from './strip-file-extension.function.js';

export class AutoEntry implements PreparedBuildUpdate {
	private options: Required<AutoEntryOptions>;

	private entryFiles: string[] = [];
	private entryMap: Record<string, string> = {};
	private entryExports: Record<string, PackageJsonExportConditions> = {};

	constructor(options: AutoEntryOptions) {
		this.options = normalizeAutoEntryOptions(options);
	}

	getViteConfigUpdates(): UserConfig {
		return { build: { lib: { entry: this.entryMap } } };
	}

	async preUpdate(packageJson: PackageJson) {
		packageJson.exports = undefined;
		packageJson.main = undefined;
		packageJson.module = undefined;

		const fullEntryPath = join(this.options.sourceDirectory, this.options.entryDir);
		this.entryFiles = await collectImmediate(fullEntryPath, 'file');

		this.entryMap = createPathRecordFromPaths(this.entryFiles, { keyOnlyFilename: true });

		this.entryMap = offsetPathRecordValues(this.entryMap, fullEntryPath);
	}

	update(packageJson: PackageJson) {
		const hasUmd = this.options.formats.includes('umd');
		const hasEsm = this.options.formats.includes('es');
		const hasCjs = this.options.formats.includes('cjs');

		const umdExtension = getBundledFileExtension({
			format: 'umd',
			packageType: packageJson.type,
		});
		const esmExtension = getBundledFileExtension({
			format: 'es',
			packageType: packageJson.type,
		});
		const cjsExtension = getBundledFileExtension({
			format: 'cjs',
			packageType: packageJson.type,
		});

		this.entryExports = Object.entries(this.entryMap).reduce(
			(accumulator, [key, entryFile]) => {
				const extensionlessPath = stripFileExtension(entryFile);
				// Assume there will be a `.d.ts` generated
				const typesPath = `.${posix.sep}${posix.normalize(`${extensionlessPath}.d.ts`)}`;
				const exportConditions: PackageJsonExportConditions = {
					types: typesPath,
				};

				// Add the source ts file as default, will be removed for dist artifact
				exportConditions.default = `.${posix.sep}${posix.normalize(
					`${extensionlessPath}.ts`
				)}`;

				if (hasUmd) {
					exportConditions.require = `.${posix.sep}${posix.normalize(
						`${extensionlessPath}${umdExtension}`
					)}`;
				}

				if (hasCjs) {
					exportConditions.require = `.${posix.sep}${posix.normalize(
						`${extensionlessPath}${cjsExtension}`
					)}`;
				}

				if (hasEsm) {
					exportConditions.import = `.${posix.sep}${posix.normalize(
						`${extensionlessPath}${esmExtension}`
					)}`;
				}
				if (key === 'index') {
					accumulator['.'] = exportConditions;
				} else {
					accumulator['./' + key] = exportConditions;
				}
				return accumulator;
			},
			{} as Record<string, PackageJsonExportConditions>
		);

		return { exports: this.entryExports };
	}

	adjustPaths(packageJson: PackageJson, packageJsonTarget: PackageJsonTarget): PackageJson {
		const entryExportsOffset = Object.entries(packageJson.exports ?? {}).reduce(
			(accumulator, [key, exportCondition]) => {
				if (key in this.entryExports && typeof exportCondition === 'object') {
					switch (packageJsonTarget) {
						case 'out-to-out':
						case 'out': {
							exportCondition.default = undefined;
							break;
						}
						case 'source': {
							exportCondition.types = undefined;
							exportCondition.require = undefined;
							exportCondition.import = undefined;
							break;
						}
					}

					accumulator[key] = Object.entries(exportCondition).reduce(
						(conditions, [key, path]) => {
							if (path !== undefined) {
								conditions[key] = retargetPackageJsonPath(path, {
									packageJsonTarget,
									outDir: this.options.outDir,
								});
							}
							return conditions;
						},
						{} as PackageJsonExportConditions
					);
				} else {
					accumulator[key] = exportCondition;
				}

				return accumulator;
			},
			{} as PackageJsonExports
		);

		return { exports: entryExportsOffset };
	}
}
