'use strict';

import executeCronjob from '../../../src/functions/execute/execute.cronjob';
import CronJobType from '../../../src/_types/cronjob.type';
import * as cron from 'node-cron';

// Mock node-cron
jest.mock('node-cron');

const mockCron = cron as jest.Mocked<typeof cron>;

describe('execute.cronjob tests', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockCron.schedule.mockReturnValue({} as any);
	});

	it('should be defined', () => {
		expect(executeCronjob).toBeDefined();
		expect(typeof executeCronjob).toBe('function');
	});

	it('should schedule cron job immediately when init is not a function', () => {
		const mockJob = jest.fn();
		const cronjob: CronJobType = {
			schedule: '0 0 * * *',
			job: mockJob,
			init: 'not a function' as any,
			options: { timezone: 'UTC' }
		};

		executeCronjob(cronjob);

		expect(mockCron.schedule).toHaveBeenCalledTimes(1);
		expect(mockCron.schedule).toHaveBeenCalledWith('0 0 * * *', mockJob, { timezone: 'UTC' });
	});

	it('should schedule cron job immediately when init is undefined', () => {
		const mockJob = jest.fn();
		const cronjob: CronJobType = {
			schedule: '*/5 * * * *',
			job: mockJob,
			options: { scheduled: false }
		};

		executeCronjob(cronjob);

		expect(mockCron.schedule).toHaveBeenCalledTimes(1);
		expect(mockCron.schedule).toHaveBeenCalledWith('*/5 * * * *', mockJob, { scheduled: false });
	});

	it('should schedule cron job after init resolves when init is a function', async () => {
		const mockJob = jest.fn();
		const mockInit = jest.fn().mockResolvedValue(undefined);
		const cronjob: CronJobType = {
			schedule: '0 */2 * * *',
			job: mockJob,
			init: mockInit,
			options: { name: 'test-job' }
		};

		executeCronjob(cronjob);

		// Wait for the promise to resolve
		await new Promise(resolve => setTimeout(resolve, 10));

		expect(mockInit).toHaveBeenCalledTimes(1);
		expect(mockCron.schedule).toHaveBeenCalledTimes(1);
		expect(mockCron.schedule).toHaveBeenCalledWith('0 */2 * * *', mockJob, { name: 'test-job' });
	});



	it('should handle cronjob without options', () => {
		const mockJob = jest.fn();
		const cronjob: CronJobType = {
			schedule: '30 14 * * *',
			job: mockJob
		};

		executeCronjob(cronjob);

		expect(mockCron.schedule).toHaveBeenCalledTimes(1);
		expect(mockCron.schedule).toHaveBeenCalledWith('30 14 * * *', mockJob, undefined);
	});

	it('should handle async job function', () => {
		const mockJob = jest.fn().mockResolvedValue(undefined);
		const cronjob: CronJobType = {
			schedule: '0 6 * * *',
			job: mockJob
		};

		executeCronjob(cronjob);

		expect(mockCron.schedule).toHaveBeenCalledTimes(1);
		expect(mockCron.schedule).toHaveBeenCalledWith('0 6 * * *', mockJob, undefined);
	});

	it('should handle complex execution flow', async () => {
		const executionOrder: string[] = [];
		const mockInit = jest.fn().mockImplementation(() => {
			executionOrder.push('init');
			return Promise.resolve();
		});
		const mockJob = jest.fn().mockImplementation(() => {
			executionOrder.push('job');
		});
		const cronjob: CronJobType = {
			schedule: '0 12 * * *',
			job: mockJob,
			init: mockInit
		};

		executeCronjob(cronjob);

		// Wait for the promise to resolve
		await new Promise(resolve => setTimeout(resolve, 10));

		expect(executionOrder).toEqual(['init']);
		expect(mockCron.schedule).toHaveBeenCalledTimes(1);
		expect(mockCron.schedule).toHaveBeenCalledWith('0 12 * * *', mockJob, undefined);
	});

	it('should handle different schedule formats', () => {
		const mockJob = jest.fn();
		const testSchedules = [
			'0 0 * * *',
			'*/15 * * * *',
			'0 9-17 * * 1-5',
			'@hourly',
			'@daily'
		];

		testSchedules.forEach(schedule => {
			const cronjob: CronJobType = {
				schedule,
				job: mockJob
			};
			executeCronjob(cronjob);
		});

		expect(mockCron.schedule).toHaveBeenCalledTimes(testSchedules.length);
		testSchedules.forEach((schedule, index) => {
			expect(mockCron.schedule).toHaveBeenNthCalledWith(index + 1, schedule, mockJob, undefined);
		});
	});
});
