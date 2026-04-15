import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: [
			'**/node_modules/**',
			'**/coverage/**',
			'**/lib/**',
			'**/docs/**',
			'**/.nyc_output/**',
			'**/.sonarlint/**',
			'test/**/*.js',
			'**/*.min.js'
		]
	},
	{
		files: ['jest.config.js'],
		languageOptions: {
			globals: {
				module: 'writable',
				require: 'readonly',
				exports: 'writable',
				__dirname: 'readonly',
				__filename: 'readonly'
			}
		}
	},
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	sonarjs.configs.recommended,
	eslintConfigPrettier,
	{
		files: ['**/*.ts'],
		rules: {
			'no-console': ['error', { allow: ['warn', 'log', 'error', 'info'] }],
			'sonarjs/no-commented-code': 'off',
			curly: ['error', 'multi-line'],
			'max-classes-per-file': ['error', 5],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrors: 'none'
				}
			],
			'@typescript-eslint/no-restricted-types': [
				'error',
				{
					types: {
						Object: { message: 'Use {} instead.' }
					}
				}
			],
			'@typescript-eslint/no-explicit-any': 'off'
		}
	},
	{
		files: [
			'src/mongodb/functions/process.models.ts',
			'src/functions/execute/execute.on.files.recursively.ts',
			'src/functions/action/add.action.cronjobs.ts',
			'src/functions/action/add.action.watchers.ts',
			'src/functions/action/add.action.workers.ts'
		],
		rules: {
			'@typescript-eslint/no-require-imports': 'off'
		}
	},
	{
		files: ['test/**/*.ts'],
		rules: {
			'@typescript-eslint/no-require-imports': 'off',
			'sonarjs/no-ignored-exceptions': 'off',
			'no-empty': 'off',
			'sonarjs/pseudo-random': 'off'
		}
	}
);
