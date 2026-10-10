import type { Reporter, FullConfig, Suite } from '@playwright/test/reporter';

// (1.64) FullConfig.filteredProjects is the list of projects selected for THIS
// run, after `--project` and `default: false` are applied. `config.projects`
// still lists every project in the config file.
//
// Before 1.64 a reporter or globalSetup had to re-parse process.argv to learn
// which projects were running, and got it wrong for wildcards and dependencies.
// Typical uses: name the uploaded report after the projects, or skip seeding
// a database that only the opted-out project needs.
class SelectedProjectsReporter implements Reporter {
  onBegin(config: FullConfig, suite: Suite) {
    const all = config.projects.map(p => p.name);
    const selected = config.filteredProjects.map(p => p.name);
    const skipped = all.filter(name => !selected.includes(name));
    console.log(`projects selected: ${selected.join(', ')}` +
        (skipped.length ? ` (not selected: ${skipped.join(', ')})` : ''));

    // (1.64) `--shuffle` records its seed in config metadata. Print it so a
    // failing order can be replayed with `--shuffle=<seed>`.
    const seed = config.metadata.shuffleSeed;
    if (seed !== undefined)
      console.log(`shuffle seed: ${seed}  (replay with --shuffle=${seed})`);
  }

  printsToStdio() {
    return false;
  }
}

export default SelectedProjectsReporter;
