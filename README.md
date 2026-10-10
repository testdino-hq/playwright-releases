# playwright-releases

Runnable examples for every Playwright release we track, verified against the real
published package. What's new in each Playwright version, with commented specs you can run.

## Latest: Playwright 1.64 video

[![Playwright 1.64 what's new: --shuffle, locator.within(), project.default, 60fps test videos, WebMCP](./1.64/video/thumbnail.png)](https://github.com/testdino-hq/playwright-releases/raw/main/1.64/video/playwright-1.64-whats-new.mp4)

3 minutes, one chapter per feature: the problem before, the 1.64 solution, and a practical use
case. [Play the video](https://github.com/testdino-hq/playwright-releases/raw/main/1.64/video/playwright-1.64-whats-new.mp4)
or read the [1.64 breakdown](./1.64/readme.md).

Each release folder has a short `readme.md` (how to run, what each spec shows, upgrade
or skip) and an `examples/` folder of commented specs. The specs are the documentation.

## Releases

| Version | Released | Notes | Examples |
| --- | --- | --- | --- |
| 1.64 | 7 Oct 2026 | [readme](./1.64/readme.md), [video](./1.64/video/playwright-1.64-whats-new.mp4) | [examples](./1.64/examples) |
| 1.62 | 24 Jul 2026 | [readme](./1.62/readme.md) | [examples](./1.62/examples) |
| 1.61 | 15 Jun 2026 | [readme](./1.61/README.md) | [tests](./1.61/tests) |
| 1.60 | 11 May 2026 | [readme](./1.60/readme.md) | [examples](./1.60/examples) |

## Run any release

```bash
cd 1.64/examples
npm install
npx playwright install chromium
npm test
```

## Contributing

Add a top-level folder named after the version (for example `1.65/`), follow the
existing `readme.md` plus `examples/` structure, and update the table above. Keep the
readme short and put the explanation in code comments.
