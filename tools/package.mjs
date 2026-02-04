
import { writeFileSync, copyFileSync } from 'fs';
import { join } from 'path';

import { exit } from 'process';

import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';

import packageJson from '../package.json' with {type: "json"}

// const packageJson = pJson;


function getArgs() {
	const argv = yargs(hideBin(process.argv))
		.version(false)
		.option('version', { demand: true, alias: 'v', type: 'string', default: '0.0.0', description: 'Version' })
		.option('output', { demand: false, alias: 'o', default: 'dist', description: 'Output directory' })
		.option('root', { demand: false, alias: 'r', default: '.', description: 'Root directory' })
		.argv;

	return argv;
}


function generatePackage() {
	const packageMetadata = (version) => ({
		name: packageJson.name,
		version,
		author: packageJson.author,
		description: packageJson.description,
		license: packageJson.license,
		keywords: packageJson.keywords,
		homepage: packageJson.homepage,
		repository: packageJson.repository,
		exports: packageJson.exports,
		module: packageJson.module,
		browser: packageJson.browser,
		dependencies: packageJson.dependencies,
	});

	const prepearedPackageJson = packageMetadata(getArgs().version);

	writeFileSync(join(getArgs().output, 'package.json'), JSON.stringify(prepearedPackageJson, null, '\t'));
}

function main() {
	try {
		generatePackage();
		copyFileSync(join(getArgs().root, 'LICENSE'), join(getArgs().output, 'LICENSE'));
		copyFileSync(join(getArgs().root, 'README.md'), join(getArgs().output, 'README.md'));
		console.log('Successful compiled.');
	} catch (err) {
		console.error('FAIL:');
		console.error(err);
		exit(1);
	}
}

main();
