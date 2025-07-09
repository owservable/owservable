module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src', '<rootDir>/test'],
	testMatch: ['**/test/**/*.spec.ts'],
	transform: {
		'^.+\\.ts$': 'ts-jest',
	},
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/**/*.d.ts',
		'!src/**/*.spec.ts',
		'!src/**/*.test.ts',
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
	testTimeout: 30000,
	moduleFileExtensions: ['ts', 'js', 'json'],
	moduleNameMapping: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	extensionsToTreatAsEsm: [],
	verbose: true,
}; 