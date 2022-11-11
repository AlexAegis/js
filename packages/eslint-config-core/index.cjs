module.exports = {
	parser: '@typescript-eslint/parser',
	extends: [
		'eslint:recommended', // 'eslint:all'
		'plugin:unicorn/recommended', // 'plugin:unicorn/all'
		'plugin:@typescript-eslint/recommended', // 'plugin:@typescript-eslint/all',
		// 'plugin:@typescript-eslint/recommended-requiring-type-checking', // TODO: project setting
		// 'plugin:@typescript-eslint/strict',
		'prettier',
	],
	plugins: ['@typescript-eslint'],
	ignorePatterns: ['node_modules', 'dist', 'coverage', '.turbo', 'tmp'],
	overrides: [],
	settings: {
		next: {
			rootDir: ['apps/*/'],
		},
	},
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
	},
	env: {
		browser: true,
		es2020: true,
		node: true,
	},
	rules: {
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		quotes: ['error', 'single', { avoidEscape: true }],
		'unicorn/no-array-reduce': 'off',
		'unicorn/prevent-abbreviations': 'off', // no thanks
		'unicorn/prefer-top-level-await': 'off', // Until ES2022 is used as target
		'unicorn/no-useless-undefined': 'off', // for .catch(() => undefined)
	},
};
