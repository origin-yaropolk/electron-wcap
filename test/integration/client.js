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
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'content-type': 'application/json',
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'content-length': Buffer.byteLength(body)
					}
				};

				const req = http.request(options);

				req.on('response', (res) => {
					res.on('data', (chunk) => {
						console.log("GOT DATA", chunk.toString())
					});

					res.on('end', () => {
						console.log("GOT RESPONSE")
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
