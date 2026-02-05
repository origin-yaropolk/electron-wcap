import { builtinModules } from 'node:module';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

import typescript from '@rollup/plugin-typescript';

const pkgJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json')));
const dependencies = Object.keys(pkgJson.dependencies || {});
const peerDependencies = Object.keys(pkgJson.peerDependencies || {});
const external = [...builtinModules, /^node:/, 'electron', ...dependencies, ...peerDependencies];

const outputOptions = {
	sourcemap: true,
	strict: false,
	freeze: false,
	externalLiveBindings: false,
	generatedCode: {
		preset: 'es2015',
		symbols: false,
	},
};

// a simple plugin that adds a package.json file with type: module
const modulePackageJson = {
	name: 'package-json-module-type',
	generateBundle() {
		this.emitFile({
			type: 'asset',
			fileName: 'package.json',
			source: '{"type": "module"}',
		});
	},
};

const integrationTestPackageJson = {
	name: 'integration-test-package-json',
	generateBundle() {
		this.emitFile({
			type: 'asset',
			fileName: 'test/integration/package.json',
			source: JSON.stringify({
				name: 'electron-wcap-integration-test',
				main: 'provider.integration.test.js'
			}, null, 2),
		});
	},
};

function transpileFiles(format, input, outDir) {
	return {
		input,
		output: {
			...outputOptions,
			format,
			dir: outDir,
			preserveModules: true,
		},
		treeshake: { moduleSideEffects: false },
		plugins: [
			typescript({
				tsconfig: './src/tsconfig.json',
				noEmitOnError: true,
				include: ['src/**/*.ts', 'test/integration/**/*.ts'],
				exclude: ['src/**/__tests__/**'],
				compilerOptions: { outDir },
			}),
			format === 'esm' ? modulePackageJson : (format === 'cjs' ? integrationTestPackageJson : {}),
		],
		external,
	};
}

const entryPoints = [
	'src/index.ts',
	'src/main/index.ts',
	'src/preload/index.ts',
	'test/integration/provider.integration.test.ts',
	'test/integration/preload.ts',
];

export default [
	transpileFiles('cjs', entryPoints, './dist'),
	transpileFiles('esm', entryPoints, './dist/esm'),
];
