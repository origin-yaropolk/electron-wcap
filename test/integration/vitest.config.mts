import { defineConfig } from 'vitest/config';

const retries = 3;

export default defineConfig({
	test: {
		include: ['./**/*test.ts'],
		maxWorkers: 1,
		retry: process.env.CI ? retries : 0,
		disableConsoleIntercept: true,
		silent: false,
		pool: 'threads',
		reporters: process.env.DEBUG
			? ['default']
			: ['verbose'],
	},
});
