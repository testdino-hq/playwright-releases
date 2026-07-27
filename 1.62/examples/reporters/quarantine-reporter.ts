import type { Reporter, FullConfig, Suite, TestCase, TestRun } from '@playwright/test/reporter';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// (1.62) Reporter.preprocess() is the first officially supported way to decide
// WHICH tests run, from outside the test files.
//
// Before 1.62 your options were: --grep (needs the answer encoded in titles),
// test.skip() inside the file (needs a code change and a PR per quarantine),
// or a homegrown global-setup hack that rewrote the file list.
//
// preprocess() runs after config resolution and before onBegin(), and hands you
// the whole suite plus a `testRun` control object:
//
//   testRun.skip(test, reason)     -> not executed, reported as skipped
//   testRun.fixme(test, reason)    -> not executed, reported as skipped (intent: fix later)
//   testRun.fail(test, reason)     -> IS executed, and must fail to pass
//   testRun.exclude(test)          -> not executed, and absent from the report entirely
//   testRun.skipSharding()         -> you own sharding; Playwright's --shard filter steps aside
//
// Two facts that shape what you can build:
//   1. The suite already reflects --project, --grep and .only.
//   2. The suite IGNORES --shard. You see the whole corpus, before sharding.
//      That is what makes reporter-driven sharding possible.

const QUARANTINE_FILE = join(process.cwd(), 'quarantine.json');

type QuarantineEntry = { title: string; reason: string; mode?: 'skip' | 'fail' };

class QuarantineReporter implements Reporter {
  private quarantined: QuarantineEntry[] = [];

  async preprocess({ config, suite, testRun }: {
    config: FullConfig;
    suite: Suite;
    testRun: TestRun;
  }) {
    // On by default here so `npm test` is green. Run with NO_QUARANTINE=1 to
    // see the same suite without the filter and watch two tests go red.
    if (process.env.NO_QUARANTINE)
      return;

    try {
      this.quarantined = JSON.parse(readFileSync(QUARANTINE_FILE, 'utf-8'));
    } catch {
      return; // No quarantine list, nothing to do.
    }

    let skipped = 0;
    let expectedToFail = 0;

    for (const test of suite.allTests()) {
      const entry = this.match(test);
      if (!entry)
        continue;

      if (entry.mode === 'fail') {
        // Runs the test and requires it to fail. This is the honest way to
        // track known-broken functionality: the day someone fixes it, the
        // suite turns red and tells you to delete the quarantine entry.
        testRun.fail(test, entry.reason);
        expectedToFail++;
      } else {
        testRun.skip(test, entry.reason);
        skipped++;
      }
    }

    console.log(
        `[quarantine] ${skipped} skipped, ${expectedToFail} expected-to-fail ` +
        `(of ${suite.allTests().length} tests, ${config.projects.length} projects)`);
  }

  private match(test: TestCase): QuarantineEntry | undefined {
    const fullTitle = test.titlePath().filter(Boolean).join(' > ');
    return this.quarantined.find(q => fullTitle.includes(q.title));
  }
}

export default QuarantineReporter;
