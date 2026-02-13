## Installing dependecies

> [!NOTE] 
> It's highly recommended to use with [volta.sh](https://volta.sh) and pnpm.

install dependecies
```bash
pnpm install
```

## Scripts

- `pnpm build` — Rollup build (CJS + ESM)
	Output: `dist/` (CommonJS) and `dist/esm/` (ESM).
- `pnpm lint` — Lint (editorconfig + ESLint)
- `pnpm lint:test` — Lint tests (editorconfig + ESLint)
- `pnpm test` — Unit tests (Jest)
- `node ./tools/package.mjs --version x.y.z` — copy readme and license to dist, generage package.json with version
	Output: `dist/README.md`, `dist/LICENSE` and `dist/package.json`.


## Publish

```bash
cd ./dist
npm publish --access public
```
