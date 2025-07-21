import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
	{ ignores: ['dist', 'node_modules'] },
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			ecmaVersion: 2021,
			sourceType: 'module',
			globals: globals.node,
		},
		plugins: {
			prettier,
		},
		extends: [
			js.configs.recommended,
			...tseslint.configs.recommended,
			eslintPluginPrettierRecommended,
		],
		rules: {
			...eslintPluginPrettierRecommended.rules,
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
);
