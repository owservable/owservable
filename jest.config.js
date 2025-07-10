module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src', '<rootDir>/test'],

	// Test file patterns
	testMatch: ['**/test/**/*.spec.ts'],

	// TypeScript configuration
	transform: {
		'^.+\\.ts$': 'ts-jest'
	},

	// Module file extensions
	moduleFileExtensions: ['ts', 'js', 'json'],

	// Setup Jest types globally
	setupFilesAfterEnv: [],

	// Coverage configuration
	collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/*.spec.ts', '!src/**/*.test.ts'],

	// Coverage output directory
	coverageDirectory: 'coverage',

	// Coverage reporters
	coverageReporters: ['lcov', 'html', 'text', 'text-summary'],

	// Coverage thresholds (optional)
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80
		}
	},

	// Clear mocks between tests
	clearMocks: true,

	// Verbose output
	// verbose: true,

	// Exit on test failure
	// forceExit: true,

	// Timeout for tests (30 seconds like mocha config)
	testTimeout: 30000
};
