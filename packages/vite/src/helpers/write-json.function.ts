import { writeFile } from 'node:fs/promises';
import { getPrettierFormatter } from './try-prettify.function.js';

export interface WriteJsonOptions {
	/**
	 * Formats the json file using prettier and your configuration.
	 *
	 * Disable if you don't have prettier
	 *
	 * @default true
	 */
	autoPrettier?: boolean;
	/**
	 * If it's a dry run, nothing will be written to the disk, instead it will
	 * log it out.
	 *
	 * @default false
	 */
	dry?: boolean;
}

export const writeJson = async (
	record: Record<string, unknown>,
	path: string,
	options?: WriteJsonOptions
): Promise<void> => {
	const raw = JSON.stringify(record);
	const dry = options?.dry ?? false;
	const autoPrettier = options?.autoPrettier ?? true;

	if (autoPrettier) {
		const formatter = await getPrettierFormatter({ parser: 'json-stringify' });
		const formatted = formatter(raw);
		if (!dry) {
			await writeFile(path, formatted);
		} else {
			console.log('dry write to', path, 'file content:', formatted);
		}
	} else {
		if (!dry) {
			await writeFile(path, raw);
		} else {
			console.log('dry, unformatted write to', path, 'file content:', raw);
		}
	}
};
