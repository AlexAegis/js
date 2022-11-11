import { isAbsolute, join } from 'node:path';

/**
 *
 * @param path
 * @param cwd @default process.cwd()
 * @returns an absolue path
 */
export const toAbsolute = (path: string, cwd: string = process.cwd()): string => {
	return isAbsolute(path) ? path : join(cwd, path);
};
