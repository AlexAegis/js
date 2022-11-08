import { extname, isAbsolute, join } from 'node:path';

import { chmod, lstat, readFile, writeFile } from 'node:fs/promises';
import type { Logger } from './create-vite-plugin-logger.function.js';

export const SHEBANG_SEQUENCE = '#!';
export const SHELL_SHEBANG = '#!/usr/bin/env sh';
export const NODE_SHEBANG = '#!/usr/bin/env node';
export const TSNODE_SHEBANG = '#!/usr/bin/env node --require ts-node/register';

export const shebangs: Record<string, string> = {
	['.js']: NODE_SHEBANG,
	['.cjs']: NODE_SHEBANG,
	['.mjs']: NODE_SHEBANG,
	['.ts']: TSNODE_SHEBANG,
	['.mts']: TSNODE_SHEBANG,
	['.cts']: TSNODE_SHEBANG,
	['.sh']: SHELL_SHEBANG,
};

export interface TurnIntoExecutableOptions {
	/**
	 * @default process.cwd()
	 */
	cwd?: string;

	/**
	 * @default undefined
	 */
	logger?: Logger;
}

/**
 * Marks a file as executable for its user, and only readable for everyone else
 * If an appropriate shebang is found, it's also prefixed to the top of the
 * file, unless it's already starting with a shebang
 */
export const turnIntoExecutable = async (
	file: string,
	options?: TurnIntoExecutableOptions
): Promise<void> => {
	const cwd = options?.cwd ?? process.cwd();
	const filePath = isAbsolute(file) ? file : join(cwd, file);
	const fileStats = await lstat(filePath).catch(() => undefined);

	if (!fileStats) {
		options?.logger?.error(`can't turn ${file} into executable, doesn't exist in ${cwd}`);
		return;
	} else if (!fileStats.isFile()) {
		options?.logger?.error(`can't turn ${file} into executable, not a file`);
		return;
	}

	const extension = extname(filePath);

	if (Object.keys(shebangs).includes(extension)) {
		const shebang = shebangs[extension];
		const rawFile = await readFile(filePath, {
			encoding: 'utf8',
		}).catch(() => undefined);

		if (rawFile !== undefined && !rawFile.startsWith(SHEBANG_SEQUENCE)) {
			const rawFileWithShebang = `${shebang}\n\n${rawFile}`;
			await writeFile(filePath, rawFileWithShebang)
				.then(() => {
					options?.logger?.log(`prefixed ${file} with shebang: ${shebang}`);
				})
				.catch(() => undefined);
		}
	}

	if (!(fileStats.mode & 0o111)) {
		await chmod(filePath, 0o744)
			.then(() => {
				options?.logger?.log(`marked ${file} as executable`);
			})
			.catch(() => undefined);
	}
};
