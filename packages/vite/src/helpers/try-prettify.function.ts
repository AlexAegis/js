import type { BuiltInParserName, Options } from 'prettier';

export interface PrettifyOptions {
	/**
	 * @default 'json-stringify'
	 */
	parser?: BuiltInParserName;

	/**
	 * @default process.cwd()
	 */
	cwd?: string;
}

/**
 * @returns a prettified string if prettier is available, an untouched string
 * otherwise
 */
export const tryPrettify = async (content: string, options?: PrettifyOptions): Promise<string> => {
	const formatter = await getPrettierFormatter(options);
	return formatter(content);
};

/**
 * @returns a function that formats strings with prettier
 */
export const getPrettierFormatter = async (
	options?: PrettifyOptions
): Promise<(content: string) => string> => {
	try {
		const prettier = await import('prettier');
		const prettierConfig = await prettier.default.resolveConfig(options?.cwd ?? process.cwd());
		const prettierOptions: Options = {
			...prettierConfig,
			parser: options?.parser ?? 'babel',
		};
		return (content) => prettier.default.format(content, prettierOptions);
	} catch {
		return (content) => content;
	}
};
