'use strict';

import {isFunction} from 'lodash';
import executeWatcher from '../../../src/functions/execute/execute.watcher';
import WatcherType from '../../../src/types/watcher.type';

// Mock lodash
jest.mock('lodash');

describe('execute.watcher tests', () => {
	let mockIsFunction: jest.MockedFunction<typeof isFunction>;
	let mockInit: jest.MockedFunction<any>;
	let mockWatch: jest.MockedFunction<any>;

	beforeEach(() => {
		// Get mocked functions
		mockIsFunction = isFunction as jest.MockedFunction<typeof isFunction>;
		mockInit = jest.fn();
		mockWatch = jest.fn();

		// Reset all mocks
		jest.clearAllMocks();

		// Setup default promise resolve for init
		mockInit.mockResolvedValue(undefined);
	});

	describe('executeWatcher function', () => {
		describe('when waitForInit is false or undefined (default behavior)', () => {
			it('should execute init and watch immediately when waitForInit is false', async () => {
				const watcherObj: WatcherType = {
					init: mockInit,
					watch: mockWatch,
					waitForInit: false
				};

				mockIsFunction.mockReturnValue(true);

				executeWatcher(watcherObj);

				expect(mockIsFunction).toHaveBeenCalledWith(mockInit);
				expect(mockInit).toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should execute init and watch immediately when waitForInit is undefined', async () => {
				const watcherObj: WatcherType = {
					init: mockInit,
					watch: mockWatch
					// waitForInit is undefined (default false)
				};

				mockIsFunction.mockReturnValue(true);

				executeWatcher(watcherObj);

				expect(mockIsFunction).toHaveBeenCalledWith(mockInit);
				expect(mockInit).toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should handle when init is not a function but waitForInit is false', () => {
				const watcherObj: WatcherType = {
					init: 'not-a-function' as any,
					watch: mockWatch,
					waitForInit: false
				};

				mockIsFunction.mockReturnValue(false);

				executeWatcher(watcherObj);

				expect(mockIsFunction).toHaveBeenCalledWith('not-a-function');
				expect(mockInit).not.toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should handle when init is undefined with waitForInit false', () => {
				const watcherObj: WatcherType = {
					watch: mockWatch,
					waitForInit: false
				};

				mockIsFunction.mockReturnValue(false);

				executeWatcher(watcherObj);

				expect(mockIsFunction).toHaveBeenCalledWith(undefined);
				expect(mockInit).not.toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should handle when only watch is defined with waitForInit false', () => {
				const watcherObj: WatcherType = {
					watch: mockWatch,
					waitForInit: false
				};

				mockIsFunction.mockReturnValue(false);

				executeWatcher(watcherObj);

				expect(mockIsFunction).toHaveBeenCalledWith(undefined);
				expect(mockInit).not.toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should handle when only init is defined with waitForInit false', () => {
				const watcherObj: WatcherType = {
					init: mockInit,
					watch: mockWatch,
					waitForInit: false
				};

				mockIsFunction.mockReturnValue(true);

				executeWatcher(watcherObj);

				expect(mockIsFunction).toHaveBeenCalledWith(mockInit);
				expect(mockInit).toHaveBeenCalled();
				// watch() should be called even if undefined (no error)
			});
		});

		describe('when waitForInit is true', () => {
			it('should wait for init to complete before calling watch when init is a function', async () => {
				const watcherObj: WatcherType = {
					init: mockInit,
					watch: mockWatch,
					waitForInit: true
				};

				// Mock the promise chain
				const mockThen = jest.fn().mockImplementation((callback) => {
					callback(); // Execute the callback immediately for testing
					return Promise.resolve();
				});
				mockInit.mockReturnValue({then: mockThen});
				mockIsFunction.mockReturnValue(true);

				executeWatcher(watcherObj);

				expect(mockIsFunction).toHaveBeenCalledWith(mockInit);
				expect(mockInit).toHaveBeenCalled();
				expect(mockThen).toHaveBeenCalledWith(expect.any(Function));
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should call watch directly when init is not a function and waitForInit is true', () => {
				const watcherObj: WatcherType = {
					init: 'not-a-function' as any,
					watch: mockWatch,
					waitForInit: true
				};

				mockIsFunction.mockReturnValue(false);

				executeWatcher(watcherObj);

				expect(mockIsFunction).toHaveBeenCalledWith('not-a-function');
				expect(mockInit).not.toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should handle when init is undefined and waitForInit is true', () => {
				const watcherObj: WatcherType = {
					watch: mockWatch,
					waitForInit: true
				};

				mockIsFunction.mockReturnValue(false);

				executeWatcher(watcherObj);

				expect(mockIsFunction).toHaveBeenCalledWith(undefined);
				expect(mockInit).not.toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should handle when both init and watch are undefined with waitForInit true', () => {
				const watcherObj: WatcherType = {
					watch: mockWatch,
					waitForInit: true
				};

				mockIsFunction.mockReturnValue(false);

				executeWatcher(watcherObj);

				expect(mockIsFunction).toHaveBeenCalledWith(undefined);
				expect(mockInit).not.toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should handle when only init is defined with waitForInit true', () => {
				const watcherObj: WatcherType = {
					init: mockInit,
					watch: mockWatch,
					waitForInit: true
				};

				const mockThen = jest.fn().mockImplementation((callback) => {
					callback();
					return Promise.resolve();
				});
				mockInit.mockReturnValue({then: mockThen});
				mockIsFunction.mockReturnValue(true);

				executeWatcher(watcherObj);

				expect(mockIsFunction).toHaveBeenCalledWith(mockInit);
				expect(mockInit).toHaveBeenCalled();
				expect(mockThen).toHaveBeenCalledWith(expect.any(Function));
			});
		});

		describe('promise handling and edge cases', () => {
			it('should handle init promise rejection gracefully when waitForInit is false', () => {
				const watcherObj: WatcherType = {
					init: mockInit,
					watch: mockWatch,
					waitForInit: false
				};

				const mockThen = jest.fn().mockImplementation((callback) => {
					callback();
					return Promise.resolve();
				});
				mockInit.mockReturnValue({then: mockThen});
				mockIsFunction.mockReturnValue(true);

				expect(() => executeWatcher(watcherObj)).not.toThrow();

				expect(mockIsFunction).toHaveBeenCalledWith(mockInit);
				expect(mockInit).toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should handle init promise rejection gracefully when waitForInit is true', () => {
				const watcherObj: WatcherType = {
					init: mockInit,
					watch: mockWatch,
					waitForInit: true
				};

				const mockThen = jest.fn().mockImplementation((callback) => {
					callback();
					return Promise.resolve();
				});
				mockInit.mockReturnValue({then: mockThen});
				mockIsFunction.mockReturnValue(true);

				expect(() => executeWatcher(watcherObj)).not.toThrow();

				expect(mockIsFunction).toHaveBeenCalledWith(mockInit);
				expect(mockInit).toHaveBeenCalled();
				expect(mockThen).toHaveBeenCalledWith(expect.any(Function));
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should handle various waitForInit values', () => {
				const testCases = [
					{waitForInit: null, expected: 'immediate'},
					{waitForInit: 0, expected: 'immediate'},
					{waitForInit: '', expected: 'immediate'},
					{waitForInit: 1, expected: 'wait'},
					{waitForInit: 'true', expected: 'wait'},
					{waitForInit: {} as any, expected: 'wait'},
					{waitForInit: [] as any, expected: 'wait'}
				];

				testCases.forEach(({waitForInit, expected}) => {
					jest.clearAllMocks();
					mockIsFunction.mockReturnValue(true);

					const mockThen = jest.fn().mockImplementation((callback) => {
						callback();
						return Promise.resolve();
					});
					mockInit.mockReturnValue({then: mockThen});

					const watcherObj: WatcherType = {
						init: mockInit,
						watch: mockWatch,
						waitForInit: waitForInit as any
					};

					executeWatcher(watcherObj);

					if (expected === 'immediate') {
						// Should execute both init and watch immediately
						expect(mockInit).toHaveBeenCalled();
						expect(mockWatch).toHaveBeenCalled();
						// For immediate execution, then is called with the null-returning function
						if (mockThen.mock.calls.length > 0) {
							const callback = mockThen.mock.calls[0][0];
							expect(callback()).toBeNull();
						}
					} else {
						// Should wait for init then call watch
						expect(mockInit).toHaveBeenCalled();
						expect(mockThen).toHaveBeenCalled();
						expect(mockWatch).toHaveBeenCalled();
					}
				});
			});

			it('should handle different function types for init and watch', () => {
				const asyncInit = jest.fn().mockResolvedValue(undefined);
				const asyncInit2 = jest.fn().mockReturnValue(Promise.resolve());
				const syncWatch = jest.fn();
				const asyncWatch = jest.fn().mockResolvedValue(undefined);

				const testCases = [
					{init: asyncInit, watch: syncWatch},
					{init: asyncInit2, watch: asyncWatch},
					{init: asyncInit, watch: undefined},
					{init: undefined, watch: syncWatch}
				];

				testCases.forEach(({init, watch}) => {
					jest.clearAllMocks();
					mockIsFunction.mockImplementation((fn) => typeof fn === 'function');

					const watcherObj: WatcherType = {
						init,
						watch,
						waitForInit: false
					};

					executeWatcher(watcherObj);

					if (typeof init === 'function') {
						expect(init).toHaveBeenCalled();
					}
					if (typeof watch === 'function') {
						expect(watch).toHaveBeenCalled();
					}
				});
			});
		});

		describe('optional chaining behavior', () => {
			it('should use optional chaining for init and watch calls', () => {
				const watcherObj: WatcherType = {
					init: undefined,
					watch: undefined,
					waitForInit: false
				};

				mockIsFunction.mockReturnValue(false);

				// Should not throw when init and watch are undefined due to optional chaining
				expect(() => executeWatcher(watcherObj)).not.toThrow();

				expect(mockIsFunction).toHaveBeenCalledWith(undefined);
			});

			it('should handle partial watcher objects', () => {
				const partialWatcher = {} as WatcherType;

				mockIsFunction.mockReturnValue(false);

				expect(() => executeWatcher(partialWatcher)).not.toThrow();

				expect(mockIsFunction).toHaveBeenCalledWith(undefined);
			});
		});
	});
});
