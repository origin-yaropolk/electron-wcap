import * as http from 'node:http';

export function createTestClient(port) {
	return {
		post(data) {
			return new Promise((resolve, reject) => {
				const body = JSON.stringify(data);

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

				const req = http.request(options, (res) => {
					res.setEncoding('utf8');

					res.on('end', resolve);
				});

				req.write(JSON.stringify(data));

				req.on('err', reject);
				req.end();
			});
		}
	};
}
