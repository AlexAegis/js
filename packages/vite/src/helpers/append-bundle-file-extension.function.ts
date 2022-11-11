import type { ModuleFormat } from 'rollup';

export interface GetBundledFileExtensionOptions {
	format: ModuleFormat;
	/**
	 * @default 'commonjs'
	 */
	packageType?: 'module' | 'commonjs';
	/**
	 * @default false
	 */
	forceMjsForEs?: boolean;
}

type JsExtensionStubs = 'js' | 'cjs' | 'mjs' | `${string}.js`;
export type JsExtensions = `.${JsExtensionStubs}`;
/**
 * Default rollup behavior.
 *
 */
export const getBundledFileExtension = (options: GetBundledFileExtensionOptions): JsExtensions => {
	const packageType = options.packageType ?? 'commonjs';
	const forceMjsForEs = options.forceMjsForEs ?? false;
	switch (options.format) {
		case 'es':
		case 'esm': {
			if (forceMjsForEs) {
				return '.mjs';
			} else {
				return packageType === 'module' ? '.js' : '.mjs';
			}
		}
		case 'cjs': {
			return packageType === 'commonjs' ? '.js' : '.cjs';
		}
		default: {
			return `.${options.format}.js`;
		}
	}
};
