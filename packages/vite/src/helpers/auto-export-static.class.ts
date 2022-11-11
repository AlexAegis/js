import {
	AutoExportStaticOptions,
	normalizeAutoExportStaticOptions,
} from './auto-export-static.class.options.js';
import { collectFileMap } from './collect-export-map.function.js';
import { copyAllInto } from './copy-all-into.function.js';
import type { PackageJson } from './package-json.type.js';
import type { PreparedBuildUpdate } from './prepared-build-update.type.js';
import { toAbsolute } from './to-absolute.function.js';
export class AutoExportStatic implements PreparedBuildUpdate {
	private options: Required<AutoExportStaticOptions>;
	private staticExports: Record<string, string> = {};

	constructor(options: AutoExportStaticOptions) {
		this.options = normalizeAutoExportStaticOptions(options);
	}

	preUpdate(packageJson: PackageJson): PackageJson {
		packageJson.exports = undefined;
		return packageJson;
	}

	async update(packageJson: PackageJson): Promise<PackageJson> {
		this.staticExports = await collectFileMap(this.options.cwd, this.options.staticExportGlobs);
		await copyAllInto(
			Object.values(this.staticExports),
			toAbsolute(this.options.outDir, this.options.cwd)
		);
		packageJson.exports = { ...this.staticExports, ...packageJson.exports };
		return packageJson;
	}
}
