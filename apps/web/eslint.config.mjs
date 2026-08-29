import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import unicodeEscapePlugin from './eslint.unicode-escapes-plugin.mjs';

export default [
	{ ignores: ['node_modules/**', 'dist/**', 'build/**', 'vite.config.js', 'plugins/**'] },
	{
		files: ['**/*.js', '**/*.jsx'],
		plugins: { react, 'react-hooks': reactHooks, 'import': importPlugin },
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: { ecmaFeatures: { jsx: true } },
			globals: { ...globals.browser, React: 'readonly', Intl: 'readonly' },
		},
		settings: {
			'react': { version: 'detect' },
			'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
			'import/resolver': {
				node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
				alias: { map: [['@', './src']], extensions: ['.js', '.jsx', '.ts', '.tsx'] },
			},
		},
		rules: {
			...react.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,
			...importPlugin.flatConfigs.recommended.rules,

			'react/prop-types': 'off',
			'react/no-unescaped-entities': 'off',
			'react/display-name': 'off',
			'react/jsx-uses-react': 'off',
			'react/react-in-jsx-scope': 'off',
			'react/jsx-uses-vars': 'off',
			'react/jsx-no-comment-textnodes': 'off',

			'no-unused-vars': 'off',
			'import/no-named-as-default': 'off',
			'import/no-named-as-default-member': 'off',

			'no-undef': 'error',
			'no-empty': ['error', { allowEmptyCatch: true }],

			'import/no-self-import': 'error',
			'import/no-cycle': 'off',
		},
	},
	{
		files: ['**/*.ts', '**/*.tsx'],
		plugins: {
			'@typescript-eslint': tseslint.plugin,
			'import': importPlugin,
		},
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parser: tseslint.parser,
			globals: { ...globals.browser },
		},
		settings: {
			'react': { version: 'detect' },
			'import/extensions': ['.ts', '.tsx', '.js', '.jsx'],
			'import/resolver': {
				node: { extensions: ['.ts', '.tsx', '.js', '.jsx'] },
				alias: { map: [['@', './src']], extensions: ['.ts', '.tsx', '.js', '.jsx'] },
			},
		},
		rules: {
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-require-imports': 'off',
			'import/no-self-import': 'error',
			'import/no-cycle': 'off',
		},
	},
	{
		files: ['**/*.jsx'],
		plugins: { horizons: unicodeEscapePlugin },
		rules: { 'horizons/no-unicode-escapes-in-jsx': 'warn' },
	},
	{ files: ['tools/**/*.js', 'tailwind.config.js'], languageOptions: { globals: globals.node } },
];
