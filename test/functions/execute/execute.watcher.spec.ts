'use strict';

import executeWatcher from '../../../src/functions/execute/execute.watcher';
import WatcherType from '../../../src/types/watcher.type';

describe('execute.watcher tests', () => {
	let mockInit: jest.MockedFunction<any>;
	let mockWatch: jest.MockedFunction<any>;

	beforeEach(() => {
		// Get mocked functions
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

				executeWatcher(watcherObj);

				expect(mockInit).toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should execute init and watch immediately when waitForInit is undefined', async () => {
				const watcherObj: WatcherType = {
					init: mockInit,
					watch: mockWatch
					// waitForInit is undefined (default false)
				};

				executeWatcher(watcherObj);
				expect(mockInit).toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should handle when init is not a function but waitForInit is false', () => {
				const watcherObj: WatcherType = {
					init: 'not-a-function' as any,
					watch: mockWatch,
					waitForInit: false
				};

				executeWatcher(watcherObj);
				expect(mockInit).not.toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should handle when init is undefined with waitForInit false', () => {
				const watcherObj: WatcherType = {
					watch: mockWatch,
					waitForInit: false
				};

				executeWatcher(watcherObj);
				expect(mockInit).not.toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should handle when only watch is defined with waitForInit false', () => {
				const watcherObj: WatcherType = {
					watch: mockWatch,
					waitForInit: false
				};

				executeWatcher(watcherObj);
				expect(mockInit).not.toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should handle when only init is defined with waitForInit false', () => {
				const watcherObj: WatcherType = {
					init: mockInit,
					watch: mockWatch,
					waitForInit: false
				};

				executeWatcher(watcherObj);
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
				executeWatcher(watcherObj);
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

				executeWatcher(watcherObj);
				expect(mockInit).not.toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should handle when init is undefined and waitForInit is true', () => {
				const watcherObj: WatcherType = {
					watch: mockWatch,
					waitForInit: true
				};

				executeWatcher(watcherObj);
				expect(mockInit).not.toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should handle when both init and watch are undefined with waitForInit true', () => {
				const watcherObj: WatcherType = {
					watch: mockWatch,
					waitForInit: true
				};

				executeWatcher(watcherObj);
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
				executeWatcher(watcherObj);
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
				expect(() => executeWatcher(watcherObj)).not.toThrow();
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
				expect(() => executeWatcher(watcherObj)).not.toThrow();
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

				// Should not throw when init and watch are undefined due to optional chaining
				expect(() => executeWatcher(watcherObj)).not.toThrow();
			});

			it('should handle partial watcher objects', () => {
				const partialWatcher = {} as WatcherType;

				expect(() => executeWatcher(partialWatcher)).not.toThrow();
			});
		});

		describe('specific branch coverage for lines 9, 14-15', () => {
			it('should cover line 9: init is not a function in waitForInit=false branch', () => {
				const watcherObj: WatcherType = {
					init: 'not-a-function' as any,
					watch: mockWatch,
					waitForInit: false
				};

				executeWatcher(watcherObj);

				// init should not be called since it's not a function
				expect(mockInit).not.toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should cover lines 14-15: init is not a function in waitForInit=true branch', () => {
				const watcherObj: WatcherType = {
					init: 'not-a-function' as any,
					watch: mockWatch,
					waitForInit: true
				};

				executeWatcher(watcherObj);

				// Should go to else branch (line 15) and call watch directly
				expect(mockInit).not.toHaveBeenCalled();
				expect(mockWatch).toHaveBeenCalled();
			});

			it('should cover line 14: init is a function in waitForInit=true branch', () => {
				const mockThen = jest.fn().mockImplementation((callback) => {
					callback();
					return Promise.resolve();
				});
				mockInit.mockReturnValue({then: mockThen});

				const watcherObj: WatcherType = {
					init: mockInit,
					watch: mockWatch,
					waitForInit: true
				};

				executeWatcher(watcherObj);

				// Should call init().then() on line 14
				expect(mockInit).toHaveBeenCalled();
				expect(mockThen).toHaveBeenCalledWith(expect.any(Function));
				expect(mockWatch).toHaveBeenCalled();
			});
		});
	});
});
