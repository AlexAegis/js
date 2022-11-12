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
	forceMjsExtensionForEs?: boolean;
}

type JsExtensionStubs = 'js' | 'cjs' | 'mjs' | `${string}.js`;
export type JsExtensions = `.${JsExtensionStubs}`;
/**
 * Default rollup behavior.
 *
 */
export const getBundledFileExtension = (options: GetBundledFileExtensionOptions): JsExtensions => {
	const packageType = options.packageType ?? 'commonjs';
	const forceMjsExtensionForEs = options.forceMjsExtensionForEs ?? false;
	switch (options.format) {
		case 'es':
		case 'esm': {
			if (forceMjsExtensionForEs) {
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
