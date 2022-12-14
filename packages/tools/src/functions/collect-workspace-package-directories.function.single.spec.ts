import type { JSONSchemaForNPMPackageJsonFiles as PackageJson } from '@schemastore/package';
import type { Options } from 'globby';
import type { PathLike } from 'node:fs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { collectWorkspacePackageDirectories } from './collect-workspace-package-directories.function.js';

describe('collectWorkspacePackageDirectories with a single package', () => {
	beforeAll(async () => {
		vi.mock('globby', () => {
			return {
				globby: (_patterns: string[], options: Options): string[] => {
					expect(options.absolute).toBeTruthy();
					expect(options.onlyDirectories).toBeTruthy();
					expect(options.cwd).toBe('/foo/bar');
					return ['/foo/bar'];
				},
			};
		});
		vi.mock('node:fs', async () => {
			return {
				existsSync: vi.fn((path: PathLike) => path === '/foo/bar/package.json'),
			};
		});
		vi.mock('node:fs/promises', async () => {
			return {
				readFile: vi.fn(
					async (path: PathLike): Promise<string | undefined> =>
						path === '/foo/bar/package.json'
							? JSON.stringify({} as PackageJson)
							: undefined
				),
			};
		});
	});

	it('should be able to collect all packages in a workspace from a sub directory', async () => {
		const foundPackageJsons = await collectWorkspacePackageDirectories('/foo/bar/zed');
		expect(foundPackageJsons).toEqual(['/foo/bar']);
	});

	it('should be able to collect all packages in a workspace from the root', async () => {
		const foundPackageJsons = await collectWorkspacePackageDirectories('/foo/bar');
		expect(foundPackageJsons).toEqual(['/foo/bar']);
	});

	it('should be able to collect nothing, outside the workspace', async () => {
		const foundPackageJsons = await collectWorkspacePackageDirectories('/foo');
		expect(foundPackageJsons).toEqual([]);
	});
});
