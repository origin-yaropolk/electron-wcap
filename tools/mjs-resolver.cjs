'use strict';

module.exports = (path, options) => {
	const mjsExtRegex = /\.js$/iu;
	const resolver = options.defaultResolver;
	if (mjsExtRegex.test(path)) {
		try {
			return resolver(path.replace(mjsExtRegex, '.ts'), options);
		} catch {
			// use default resolver
		}
	}

	return resolver(path, options);
};
