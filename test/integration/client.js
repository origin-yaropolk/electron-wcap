import * as http from 'node:http';

export function createTestClient(port) {
	return {
		post(data) {
			return new Promise((resolve, reject) => {
				const body = Buffer.from(JSON.stringify({payload: data}));

				const options = {
					hostname: 'localhost',
					port,
					path: '/test',
					method: 'POST',
					headers: {
						'content-type': 'application/json',
						'content-length': Buffer.byteLength(body)
					}
				};

				const req = http.request(options);

				req.on('response', (res) => {
					res.on('data', (_chunk) => {
					});

					res.on('end', () => {
						resolve();
					});
				});

				req.write(body);

				req.on('err', reject);
				req.end();
			});
		}
	};
}
