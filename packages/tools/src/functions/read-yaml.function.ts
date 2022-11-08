import { load } from 'js-yaml';
import { readFile } from 'node:fs/promises';

export const readYaml = async <T>(path: string | undefined): Promise<T | undefined> => {
	if (path === undefined) {
		return undefined;
	}

	const rawYaml = await readFile(path, {
		encoding: 'utf8',
	}).catch(() => undefined);
	return rawYaml ? (load(rawYaml) as T) : undefined;
};
