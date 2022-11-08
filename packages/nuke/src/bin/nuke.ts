import { DEFAULT_NUKE_LIST, nuke, NukeOptions } from '../functions/index.js';

import yargs, { Argv } from 'yargs';
import packageJson from '../../package.json';
console.log('NUKE!@2');
const yarguments: Argv<NukeOptions & { cwd: string }> = yargs(process.argv.splice(2))
	.version(packageJson.version)
	.epilogue(`${packageJson.name}@${packageJson.version} see project at ${packageJson.homepage}`)
	.help()
	.completion()
	.positional('cwd', { default: process.cwd() })
	.option('skipNodeModules', {
		boolean: true,
		description: "Don't remove `node_modules` directories but try to clean them up",
		default: false,
	})
	.option('dry', {
		boolean: true,
		description: "Don't actually delete anything, just print out what would be deleted",
		default: false,
	})
	.option('nukeList', {
		array: true,
		type: 'string',
		description: "Don't actually delete anything, just print out what would be deleted",
		default: DEFAULT_NUKE_LIST,
	})
	.option('nukeMore', {
		array: true,
		type: 'string',
		description:
			'These will be nuked too. Same role as `nukeList` but defining this ' +
			"won't get rid of the built in nukelist",
	})
	.option('dontNukeIn', {
		array: true,
		type: 'string',
		description: "If it shouldn't nuke a specific package, add them here.",
	});

(async () => {
	const options = await yarguments.parseAsync();
	nuke(options.cwd, options);
})();
