# playwright-releases

Runnable examples for every Playwright release we track, verified against the real
published package.

Each release folder has a short `readme.md` (how to run, what each spec shows, upgrade
or skip) and an `examples/` folder of commented specs. The specs are the documentation.

## Releases

| Version | Released | Notes | Examples |
| --- | --- | --- | --- |
| 1.62 | 24 Jul 2026 | [readme](./1.62/readme.md) | [examples](./1.62/examples) |
| 1.61 | 15 Jun 2026 | [readme](./1.61/README.md) | [tests](./1.61/tests) |
| 1.60 | 11 May 2026 | [readme](./1.60/readme.md) | [examples](./1.60/examples) |

## Run any release

```bash
cd 1.62/examples
npm install
npx playwright install chromium
npm test
```

## Contributing

Add a top-level folder named after the version (for example `1.63/`), follow the
existing `readme.md` plus `examples/` structure, and update the table above. Keep the
readme short and put the explanation in code comments.
