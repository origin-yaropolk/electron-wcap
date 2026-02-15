import { ChildProcess, spawn, spawnSync } from 'child_process';
import { rmSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

import { sleep, TestLogger } from './utils';

function getDeleteDirectories(appName: string): string[] {
	switch (process.platform) {
		case 'win32':
			return [
				join(process.env.APPDATA || '', appName),
				join(process.env.LOCALAPPDATA || '', 'Temp', `${ appName } Crashes`),
			];
		case 'darwin':
			return [join(homedir(), 'Library', 'Application Support', appName)];
		case 'linux':
			return [join(homedir(), '.config', appName)];
	}

	throw new Error('Unknown platform');
}

export class TestContext {
	public mainProcess?: ProcessStatus;

	private started: boolean = false;

	public constructor(
		private readonly logger: TestLogger,
		private readonly electronPath: string,
		private readonly appPath: string,
		private readonly appName: string,
	) {}

	public async start(options: { secondRun?: boolean } = {}): Promise<void> {
		const log = this.logger.createLogger('Test Context');
		const appLog = this.logger.createLogger('App');

		log('Starting test app');

		const env: Record<string, any | undefined> = {
			...process.env,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			ELECTRON_ENABLE_LOGGING: true,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			ELECTRON_DISABLE_SECURITY_WARNINGS: true,
		};

		if (!options.secondRun) {
			env.APP_FIRST_RUN = true;
			this.clearAppUserData();
		}

		const args = [this.appPath];
		// Electron no longer work correctly on Github Actions 'ubuntu-latest' with sandbox
		if (process.platform === 'linux') {
			args.push('--no-sandbox');
		}

		const childProcess = spawn(this.electronPath, args, { env });

		function logLinesWithoutEmpty(input: string): void {
			input
				// Replace all the lines from the renderer
				.replace(/^\[\d+:\d+\S+] "([\s\S]+?)"(?:[\s\S]+?)$/gm, (_, msg: string) => {
					return `[Renderer] ${ msg
						.split(/[\r\n]+/)
						.filter((e: string) => e.match(/\S/))
						.join('\r\n[Renderer] ') }`;
				})
				.split(/[\r\n]+/)
				// ignore empty lines
				.filter((e: string) => e.match(/\S/))
				// Add [Main] to all non renderer lines
				.map((e: string) => (e.startsWith('[Renderer]') ? e : `[    Main] ${ e }`))
				.forEach((e: string) => appLog(e));
		}

		childProcess.stdout.on('data', (data: string) => logLinesWithoutEmpty(data.toString()));
		childProcess.stderr.on('data', (data: string) => logLinesWithoutEmpty(data.toString()));

		this.mainProcess = new ProcessStatus(childProcess);

		await this.waitForTrue(
			async() => (this.mainProcess ? this.mainProcess.isRunning() : false),
			() => 'Timeout: Waiting for app to start',
		);

		log('App process has started');

		this.started = true;
	}

	/** Stops the app and cleans up. */
	public async stop(options: { retainData?: boolean } = {}): Promise<void> {
		const log = this.logger.createLogger('Test Context');
		log('Stopping test app');

		await this.mainProcess?.kill();

		if (!options.retainData) {
			this.clearAppUserData();
		}

		log('Test app stopped');
	}

	public async waitForTrue(
		method: () => boolean | Promise<boolean>,
		message: () => string = () => 'Timeout',
		timeout: number = 12_000,
	): Promise<void> {
		if (!this.mainProcess) {
			throw new Error('Invariant violation: Call .start() first');
		}

		const isPromise = method() instanceof Promise;

		let remaining = timeout;
		while (isPromise ? !(await method()) : !method()) {
			await new Promise<void>((resolve) => setTimeout(resolve, 100));
			remaining -= 100;
			if (remaining < 0) {
				const msg = message();
				throw new Error(msg);
			}
		}
	}

	public async waitForAppClose(): Promise<void> {
		const log = this.logger.createLogger('Test Context');
		await this.waitForTrue(
			async() => (this.mainProcess ? !(await this.mainProcess.isRunning()) : false),
			() => 'Timeout: Waiting for app to die',
		);

		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		await sleep(1_000);
		log('App process has closed');
	}

	public get isStarted(): boolean {
		return this.started;
	}

	private clearAppUserData(): void {
		for (const dir of getDeleteDirectories(this.appName)) {
			try {
				rmSync(dir, { recursive: true, force: true });
			}
			catch (_) {
				//
			}
		}
	}
}

export class ProcessStatus {
	public constructor(private readonly chProcess: ChildProcess) {}

	public async kill(): Promise<void> {
		const pid = this.chProcess.pid;

		if (await this.isRunning()) {
			this.chProcess.kill();
		}

		// The tests sometimes hang in CI because the Electron processes don't exit
		if (process.platform === 'win32') {
			spawnSync('taskkill /F /IM electron.exe', { shell: true });
		}
		else if (process.platform === 'darwin') {
			spawnSync(`kill -9 ${ pid }`, { shell: true });
		}
	}

	public async isRunning(): Promise<boolean> {
		return new Promise<boolean>(() => {
			try {
				if (this.chProcess.pid) {
					process.kill(this.chProcess.pid, 0);
					return true;
				}
			}
			catch (_e) {
				//
			}

			return false;
		});
	}
}
