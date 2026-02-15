import * as http from 'node:http';

import { TestData } from './test-data';

export interface TestClient {
	post(data: TestData): Promise<void>
}

export function createTestClient(port: number): TestClient {
	return {
		post(data: TestData): Promise<void> {
			return new Promise((resolve, reject) => {
				const body = JSON.stringify(data);

				const options: http.RequestOptions = {
					hostname: 'localhost',
					port,
					path: '/test',
					method: 'POST',
					headers: {
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'content-type': 'application/json',
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'content-length': Buffer.byteLength(body)
					}
				};

				const req = http.request(options, (res) => {
					res.setEncoding('utf8');

					res.on('end', resolve);
				});

				req.on('err', reject);
				req.end();
			});
		}
	};
}
