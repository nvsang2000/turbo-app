import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
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
			globals: { ...globals.browser, ...globals.node },
		},
		plugins: {
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
			prettier,
		},
		extends: [
			js.configs.recommended,
			...tseslint.configs.recommended,
			eslintPluginPrettierRecommended,
		],
		rules: {
			...reactHooks.configs.recommended.rules,
			...eslintPluginPrettierRecommended.rules,
			'@typescript-eslint/no-explicit-any': 'off',
			'react-refresh/only-export-components': 'off',
		},
	},
);
