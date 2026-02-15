import Koa, { ParameterizedContext } from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-tree-router';
import { Readable } from 'stream';
import { gunzipSync } from 'zlib';

import {TestLogger } from './utils';

function stream2buffer(stream: Readable): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const buf: Buffer[] = [];
		stream.on('data', (chunk: Buffer) => buf.push(chunk));
		stream.on('end', () => resolve(Buffer.concat(buf)));
		stream.on('error', (err) => reject(err));
	});
}

async function getRequestBody(ctx: ParameterizedContext): Promise<Buffer> {
	let buf = await stream2buffer(ctx.req);

	if (ctx.request.headers['content-encoding'] === 'gzip') {
		buf = gunzipSync(buf);
	}

	return buf;
}

function parseTestData(data: Buffer): TestData {
	return {
		payload: [data],
	};
}

export interface TestData {
	payload: unknown;
}

export interface TestServer {
	readonly port: number;
	close(): Promise<void>;
}

export function createTestServer(
	logger: TestLogger,
	callback: (event: TestData) => void,
): TestServer {
	const log = logger.createLogger('Test Server');

	log('Starting test server');

	const app = new Koa();

	app.use(
		bodyParser({
			enableTypes: ['text'],
			textLimit: '200mb',
		}),
	);

	const router = new Router();

	router.post('/test', async(ctx) => {
		const envelope = parseTestData(await getRequestBody(ctx));
		callback(envelope);

		ctx.status = 200;
		ctx.body = 'Success';
	});

	app.use(router.routes());

	if (process.env.DEBUG) {
		app.on('error', (err: Error, _ctx: Koa.Context) => {
			console.error(err);
		});
	}

	const server = app.listen(0);
	const info = server.address();
	if (!info || typeof info === 'string') {
		throw new Error('Failed to get server address');
	}
	const port = info.port;

	return {
		get port(): number {
			return port;
		},
		close(): Promise<void> {
			return new Promise((resolve, reject) => {
				server.close((err) => {
					if (err) {
						reject(err);
					}
					else {
						resolve();
					}
				});
			});
		},
	};
}
