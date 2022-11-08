import { dirname, join } from 'node:path/posix';
import { LibraryFormats, mergeConfig, Plugin, UserConfig } from 'vite';
import { DEFAULT_OUT_DIR } from '../configs/index.js';
import { DEFAULT_ENTRY_DIR, DEFAULT_EXPORT_FORMATS } from '../helpers/auto-entry.class.options.js';
import { AutoExportStatic } from '../helpers/auto-export-static.class.js';
import { cloneJsonSerializable } from '../helpers/clone-json-serializable.function.js';
import { createVitePluginLogger } from '../helpers/create-vite-plugin-logger.function.js';
import { AutoBin, AutoEntry, deepMerge, writeJson } from '../helpers/index.js';
import type { PackageJson } from '../helpers/package-json.type.js';
import type { PreparedBuildUpdate } from '../helpers/prepared-build-update.type.js';
import { readPackageJson } from '../helpers/read-package-json.function.js';
import {
	AutolibPluginOptions,
	normalizeAutolibOptions,
	PackageJsonTarget,
} from './autolib.plugin.options.js';

/**
 * Packaged formats are defined in config.build.lib.formats, defaults to es and cjs
 *
 * TODO: This plugin will be moved to a different repo
 *
 * TODO: add an option to let the source PackageJson refer to scripts using tsnode/register node
 * calls to avoid the building requirement
 * TODO: skip postinstall hooks when non tsnode/reg sourcepackagejson to avoid not being able to
 * tun npm i (also add warning)
 * @param options
 * @returns
 */
export const autolib = (rawOptions?: AutolibPluginOptions): Plugin => {
	const options = normalizeAutolibOptions(rawOptions);
	const pluginName = 'autolib';
	const logger = createVitePluginLogger({
		pluginName,
	});
	logger.log('starting');

	// At the end of these definitions as these will only settle once
	// `configResolved` ran
	let formats: LibraryFormats[];
	let sourceDirectory: string;
	let outDirectory: string;

	// All updates leave all paths relative to the package before finalization
	const buildUpdates: PreparedBuildUpdate[] = [];

	let error: Error | undefined;

	let packageJson: PackageJson;

	return {
		name: pluginName,
		apply: 'build',
		config: async (config) => {
			const startTime = performance.now();

			formats =
				config.build?.lib && config.build?.lib.formats
					? config.build?.lib.formats
					: DEFAULT_EXPORT_FORMATS;

			sourceDirectory =
				config.build?.lib && typeof config.build?.lib?.entry === 'string'
					? dirname(config.build?.lib?.entry)
					: options.src;

			outDirectory = config.build?.outDir ?? DEFAULT_OUT_DIR;

			if (options.autoBinGlobs) {
				buildUpdates.push(
					new AutoBin({
						binGlobs: options.autoBinGlobs,
						cwd: options.cwd,
						formats,
						outDir: outDirectory,
						sourceDirectory,
						logger,
					})
				);
			}

			if (options.autoEntryDir) {
				buildUpdates.push(
					new AutoEntry({
						cwd: options.cwd,
						entryDir: options.autoEntryDir,
						formats,
						outDir: outDirectory,
						sourceDirectory,
						logger,
					})
				);
			}

			if (options.autoExportStaticGlobs) {
				buildUpdates.push(
					new AutoExportStatic({
						cwd: options.cwd,
						outDir: outDirectory,
						staticExportGlobs: options.autoExportStaticGlobs,
						logger,
					})
				);
			}

			const sourcePackageJsonLocation = join(options.cwd, options.sourcePackageJson);
			const rawPackageJson = await readPackageJson(sourcePackageJsonLocation);
			if (!rawPackageJson) {
				console.warn(
					`${pluginName} didn't find package.json at ${sourcePackageJsonLocation}!`
				);
				return;
			} else {
				packageJson = rawPackageJson;
			}

			const preUpdates = await Promise.all(
				buildUpdates.map((buildUpdate) => buildUpdate.preUpdate?.(packageJson))
			);
			deepMerge(packageJson, ...preUpdates);

			const baseViteConfigUpdates: Partial<UserConfig> = {
				build: {
					sourcemap: true,
					manifest: true,
					ssr: true,
					lib: {
						formats,
						entry: DEFAULT_ENTRY_DIR,
					},
				},
			};

			const viteConfigUpdates = await Promise.all(
				buildUpdates.map((buildUpdate) => buildUpdate.getViteConfigUpdates?.(config))
			);
			const updates = viteConfigUpdates
				.filter((update): update is Partial<UserConfig> => !!update)
				.reduce(
					(accumulator, next) => mergeConfig(accumulator, next),
					baseViteConfigUpdates
				);
			logger.log(
				`prepare phase took ${Math.floor(performance.now() - startTime)}ms to finish`
			);

			return updates;
		},
		buildEnd: (buildError) => {
			error = buildError;
		},
		writeBundle: async (outputOptions) => {
			console.log('WRITE BUNDLE FOR!', outputOptions.format);
			if (error) {
				logger.error("didn't run, error happened during build!");
				return;
			}

			const updates = await Promise.all(
				buildUpdates.map((buildUpdate) =>
					buildUpdate.update?.(packageJson, outputOptions.format)
				)
			);
			// I have to cheat a little bit because other plugins will steal the
			// thread during an async copy step
			const startTime = performance.now();

			deepMerge(packageJson, ...updates);

			const packageJsonTargets: PackageJsonTarget[] = ['dist'];
			if (options.packageJsonTarget) {
				packageJsonTargets.push(options.packageJsonTarget);
			}

			await Promise.all(
				packageJsonTargets.map(async (packageJsonTarget) => {
					const packageJsonForArtifact = cloneJsonSerializable(packageJson);
					const pathOffsets = await Promise.all(
						buildUpdates.map((buildUpdate) =>
							buildUpdate.adjustPaths?.(
								packageJsonForArtifact,
								packageJsonTarget,
								outputOptions.format
							)
						)
					);
					deepMerge(packageJsonForArtifact, ...pathOffsets);

					const destination =
						packageJsonTarget === 'dist'
							? join(options.cwd, outDirectory, 'package.json')
							: join(options.cwd, 'package.json');

					return await writeJson(
						cloneJsonSerializable(packageJsonForArtifact),
						destination,
						{
							autoPrettier: options.autoPrettier,
							dry: options.dry,
						}
					);
				})
			);

			logger.log(
				`update phase took ~${Math.floor(performance.now() - startTime)}ms to finish`
			);
		},
	};
};
