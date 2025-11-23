import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

// Limit type-aware linting to our source TypeScript files only.
// Provide a simpler config for plain JS files and exclude test harness downloads.
export default [
	// TypeScript (type-checked) rules
	...tseslint.config(
		eslint.configs.recommended,
		...tseslint.configs.recommendedTypeChecked,
		{
			files: ['src/**/*.ts'],
			languageOptions: {
				parserOptions: {
					project: ['./tsconfig.json'],
					tsconfigRootDir: import.meta.dirname,
				},
			},
			rules: {
				'@typescript-eslint/naming-convention': [
					'warn',
					{
						selector: 'import',
						format: ['camelCase', 'PascalCase'],
					},
				],
				'@typescript-eslint/no-unused-vars': [
					'warn',
					{
						argsIgnorePattern: '^_',
						varsIgnorePattern: '^_',
					},
				],
				'no-throw-literal': 'warn',
				semi: 'warn',
			},
		}
	),
	// Plain JS / build artifacts: apply basic recommended rules without TS project parsing.
	{
		files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
		ignores: [
			'out/**',
			'dist/**',
			'**/*.d.ts',
			'.vscode-test/**',
			'.vscode-test.mjs',
			'eslint.config.mjs',
			'node_modules/**'
		],
		languageOptions: {
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: 'module'
			}
		},
		rules: {
			// Minimal JS rules (can extend if desired)
		}
	},
	// Global ignores (extra safety)
	{
		ignores: [
			'.vscode-test/**',
			'node_modules/**',
			'out/**',
			'dist/**'
		]
	}
];
