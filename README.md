# playwright-releases

Curated release notes, visual breakdowns, and runnable examples for every Playwright release we track.

Each release lives in its own folder with:

- **`readme.md`**: release notes rewritten for clarity, with Mermaid diagrams (overview map, sequence flows, state machines, migration paths) and an upgrade or skip verdict.
- **`examples/`**: minimal, runnable code samples for the new APIs and behaviors introduced in that version.
- **`BLOG.md`** (1.62 onward): the long-form article, including the AI and agent tooling story.

## Releases

| Version | Released | Notes | Examples | Blog |
| --- | --- | --- | --- | --- |
| 1.62 | 24 Jul 2026 | [readme](./1.62/readme.md) | [examples](./1.62/examples) | [blog](./1.62/BLOG.md) |
| 1.61 | 15 Jun 2026 | [readme](./1.61/README.md) | [tests](./1.61/tests) | |
| 1.60 | 11 May 2026 | [readme](./1.60/readme.md) | [examples](./1.60/examples) | |

## Why this repo

Official changelogs are dense and link-heavy. This repo distills each release into:

1. A one-glance flowchart of what shipped.
2. Focused explanations of the API changes that matter day-to-day.
3. A clear verdict on whether to upgrade or skip, broken down by team profile.
4. Copy-pasteable examples you can drop into a test.

Examples are verified against the real published package rather than written from the
changelog, so the caveats and gotchas in each write-up come from running the code.

Useful when upgrading Playwright, evaluating new APIs, or onboarding a team to recent changes.

## Contributing

New releases are added as a top-level folder named after the version (for example `1.63/`). Follow the existing structure of `readme.md` plus `examples/`, and update the table above.
