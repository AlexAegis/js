module.exports = {
	extends: ['@alexaegis/eslint-config-core'],
	plugins: ['svelte'],
	ignorePatterns: ['*.cjs'],
	overrides: [{ files: ['*.svelte'], processor: 'svelte/svelte' }],
	settings: {
		'svelte3/typescript': () => require('typescript'),
	},
};
