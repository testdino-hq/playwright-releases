// The gallery: the ONE framework-specific file in the whole component-testing
// setup, and the one file Playwright does not own. Its whole job:
//
//   1. expose window.mount({ story, props })  -> render a story into #root
//   2. expose window.unmount()                -> tear it down
//   3. reuse the root across calls, so component.update(props) preserves state
//   4. reject on an unknown story or a render error
//
// This one is plain DOM with no bundler, so stories are listed explicitly.
// A Vite app would use `import.meta.glob('../../src/**/*.story.js')` instead;
// React/Vue variants live in the shipped `playwright-component-testing` skill
// (`npx playwright init-skills`).

const storyModules = {
  'components/Button': () => import('../../src/components/Button.story.js'),
  'components/Counter': () => import('../../src/components/Counter.story.js'),
  'components/ItemList': () => import('../../src/components/ItemList.story.js'),
};

async function resolveStory(storyId) {
  const separator = storyId.lastIndexOf('/');
  const path = storyId.slice(0, separator);
  const name = storyId.slice(separator + 1);

  // Exact match, or any unique trailing suffix: 'Button/Primary' also resolves.
  const key = Object.keys(storyModules)
      .find(k => k === path || k.endsWith('/' + path));
  if (!key) return undefined;

  const mod = await storyModules[key]();
  return mod[name] ?? mod.default;
}

const rootEl = document.getElementById('root');

// Kept across calls. This is what makes update() reconcile instead of remount.
let currentStory;
let instance;

window.mount = async ({ story, props }) => {
  const factory = await resolveStory(story);
  if (!factory)
    throw new Error(`Unknown story: ${story}`);

  // Same story as last time and the instance knows how to take new props:
  // update in place, preserving whatever internal state it holds.
  if (currentStory === story && instance?.update) {
    instance.update(props ?? {});
    return;
  }

  rootEl.replaceChildren();
  instance = factory(props ?? {});
  currentStory = story;
  rootEl.append(instance.el);
};

window.unmount = async () => {
  rootEl.replaceChildren();
  instance = undefined;
  currentStory = undefined;
};
