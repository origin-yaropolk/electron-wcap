import * as childProcess from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { dirname, join, sep } from 'path';

import { TestLogger, walkSync } from './utils';

const exec = promisify(childProcess.exec);

function getFiles(rootDir: string): Record<string, string> {
	return Array.from(walkSync(rootDir))
		.filter((path) => !path.endsWith('test.ts'))
		.reduce((acc, absPath) => {
			const relPath = absPath.replace(rootDir + sep, '');
			acc[relPath] = readFileSync(absPath, { encoding: 'utf-8' });
			return acc;
		}, {} as Record<string, string>);
}

function insertAfterLastImport(content: string, insert: string): string {
	const lines = content.split('\n');
	const importCount = lines.filter((l) => l.startsWith('import ')).length;

	let output = '';
	let count = 0;
	for (const line of lines) {
		output += `${ line }\n`;

		if (line.startsWith('import ')) {
			count += 1;
		}

		if (count === importCount) {
			output += `${ insert }\n`;
			count += 1;
		}
	}

	return output;
}

function convertToEsm(filename: string, content: string): [string, string] {
	if (filename.endsWith('package.json')) {
		const obj = JSON.parse(content) as { main: string };
		obj.main = obj.main.replace(/\.js$/, '.mjs');
		return [filename, JSON.stringify(obj)];
	}

	if (filename.endsWith('main.js')) {
		return [
			filename.replace(/\.js$/, '.mjs'),
			insertAfterLastImport(
				content
					.replace(/(?:const|var) (\{[\s\S]*?\}) = require\((\S*?)\)/g, 'import $1 from $2')
					.replace(/(?:const|var) (\S*) = require\((\S*)\)/g, 'import * as $1 from $2'),
				`import * as url from 'url';
const __dirname = url.fileURLToPath(new url.URL('.', import.meta.url));`,
			),
		];
	}

	return [filename, content];
}

export async function prepareTestFiles(
	logger: TestLogger,
	testBasePath: string,
	executionBasePath: string,
	electronVersion: string,
	convertFilesToEsm: boolean,
): Promise<void> {
	const log = logger.createLogger('Prepare Test Files');

	const files = getFiles(testBasePath);

	for (let [filename, content] of Object.entries(files)) {
		log(`Writing file '${ filename }'`);

		if (filename.endsWith('package.json')) {
			content = content
				.replace(/"electron": ".*"/, `"electron": "${ electronVersion }"`);
		}

		if (convertFilesToEsm) {
			[filename, content] = convertToEsm(filename, content);
		}

		const path = join(executionBasePath, filename);
		await mkdir(dirname(path), { recursive: true });
		await writeFile(path, content);
	}
}

export async function installDepsAndBuild(
	logger: TestLogger,
	packageManager: 'npm' | 'yarn' | 'pnpm',
	executionBasePath: string,
	hasBuildScript: boolean,
): Promise<void> {
	const log = logger.createLogger('Prepare Test Env');

	log('Installing dependencies...');
	await exec(`${ packageManager } install`, { cwd: executionBasePath });

	if (hasBuildScript) {
		log('Running build script...');
		await exec(`${ packageManager } run build`, { cwd: executionBasePath });
	}
}
